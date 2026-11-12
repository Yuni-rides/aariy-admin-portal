import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { ConfirmationOutcome, Order, OrderEvent, OrdersFilter } from "./orders.types";
import { ORDERS_MOCK } from "./orders.mock";
import {
  callOutcomeLabelMap,
  canCancelOrder,
  canCancelSuborder,
  deriveOrderStatus,
  matchesTab,
} from "./orders.helpers";

type Result = { success: boolean; message: string };

type OrdersStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  allOrders: Order[];
  /** Current page of the filtered list. */
  orders: Order[];
  /** Total rows matching the filter (all pages). */
  total: number;
  page: number;
  limit: number;

  fetchOrders: (page?: number, limit?: number, filter?: OrdersFilter, search?: string) => Promise<void>;
  logCall: (orderId: string, outcome: ConfirmationOutcome, note?: string) => Promise<Result>;
  cancelOrder: (orderId: string, reason: string) => Promise<Result>;
  cancelSuborder: (orderId: string, suborderId: string, reason: string) => Promise<Result>;
};

const applyFilter = (list: Order[], filter?: OrdersFilter, search?: string) => {
  const q = search?.trim().toLowerCase();
  const qDigits = q?.replace(/\D/g, "");
  return list.filter(
    (o) =>
      matchesTab(o, filter?.tab) &&
      (!q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        (!!qDigits && qDigits.length >= 4 && o.contactPhone.replace(/\D/g, "").includes(qDigits))),
  );
};

const actorName = () => {
  const user = useAuthStore.getState().user;
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Super admin";
};

const event = (order: Order, label: string, reason?: string): OrderEvent => ({
  id: `${order.id}-e${order.events.length}-${Date.now()}`,
  label,
  actor: actorName(),
  reason: reason ?? null,
  createdAt: new Date().toISOString(),
});

export const useOrdersStore = create<OrdersStore>((set, get) => {
  let lastFilter: OrdersFilter | undefined;
  let lastSearch: string | undefined;

  const source = () => (get().allOrders.length ? get().allOrders : ORDERS_MOCK);

  // Mirrors what a paginated API returns: one page of rows plus the total.
  const commit = (allOrders: Order[], page = get().page, limit = get().limit) => {
    const filtered = applyFilter(allOrders, lastFilter, lastSearch);
    const lastPage = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, lastPage);
    set({
      allOrders,
      orders: filtered.slice((safePage - 1) * limit, safePage * limit),
      total: filtered.length,
      page: safePage,
      limit,
    });
  };

  const find = (id: string) => source().find((o) => o.id === id);
  const replace = (next: Order) => commit(source().map((o) => (o.id === next.id ? next : o)));

  return {
    loading: false,
    saving: false,
    error: null,
    allOrders: [],
    orders: [],
    total: 0,
    page: 1,
    limit: 10,

    fetchOrders: async (page = 1, limit = 10, filter, search) => {
      lastFilter = filter;
      lastSearch = search;
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await ordersApi.getOrders(page, limit, filter, search);
        commit(source(), page, limit);
        set({ loading: false });
      } catch (e: any) {
        set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
      }
    },

    logCall: async (orderId, outcome, note) => {
      const order = find(orderId);
      if (!order) return { success: false, message: "Order not found" };
      if (order.status !== "PENDING_CONFIRMATION")
        return { success: false, message: "This order is no longer awaiting confirmation" };

      set({ saving: true });
      // TODO(api): await ordersApi.logConfirmationCall(orderId, { outcome, note });
      const now = new Date().toISOString();
      const calls = [
        ...order.calls,
        { id: `${orderId}-c${order.calls.length + 1}`, outcome, note: note?.trim() || null, csrName: actorName(), calledAt: now },
      ];
      let next: Order = { ...order, calls };
      let message = `Call logged: ${callOutcomeLabelMap[outcome]}`;

      if (outcome === "CONFIRMED") {
        // Confirmation releases each parcel to its seller as a new order.
        next = {
          ...next,
          status: "CONFIRMED",
          confirmedAt: now,
          confirmedBy: actorName(),
          suborders: order.suborders.map((s) =>
            s.status === "AWAITING_CONFIRMATION" ? { ...s, status: "NEW" } : s,
          ),
          events: [...order.events, event(order, "Confirmed on call", note)],
        };
        message = `${order.orderNumber} confirmed; sellers notified`;
      } else if (outcome === "CUSTOMER_DECLINED") {
        const reason = note?.trim() || "Customer declined on call.";
        next = {
          ...next,
          status: "CANCELLED",
          cancelledBy: "CSR",
          cancelReason: reason,
          cancelledAt: now,
          suborders: order.suborders.map((s) => ({
            ...s,
            status: "CANCELLED",
            cancelledBy: "CSR",
            cancelReason: reason,
          })),
          events: [...order.events, event(order, "Cancelled: customer declined", reason)],
        };
        message = `${order.orderNumber} cancelled; held stock released`;
      } else {
        next = {
          ...next,
          events: [...order.events, event(order, `Call: ${callOutcomeLabelMap[outcome]}`, note)],
        };
      }

      replace(next);
      set({ saving: false });
      return { success: true, message };
    },

    cancelOrder: async (orderId, reason) => {
      if (!reason.trim()) return { success: false, message: "Add a reason for the cancellation" };
      const order = find(orderId);
      if (!order) return { success: false, message: "Order not found" };
      if (!canCancelOrder(order))
        return { success: false, message: "A parcel is already with the courier; cancel parcels one by one" };

      set({ saving: true });
      // TODO(api): await ordersApi.cancelOrder(orderId, { reason });
      const now = new Date().toISOString();
      replace({
        ...order,
        status: "CANCELLED",
        cancelledBy: "ADMIN",
        cancelReason: reason.trim(),
        cancelledAt: now,
        suborders: order.suborders.map((s) =>
          canCancelSuborder(s)
            ? { ...s, status: "CANCELLED", cancelledBy: "ADMIN", cancelReason: reason.trim() }
            : s,
        ),
        events: [...order.events, event(order, "Order cancelled by admin", reason.trim())],
      });
      set({ saving: false });
      return { success: true, message: `${order.orderNumber} cancelled` };
    },

    cancelSuborder: async (orderId, suborderId, reason) => {
      if (!reason.trim()) return { success: false, message: "Add a reason for the cancellation" };
      const order = find(orderId);
      const parcel = order?.suborders.find((s) => s.id === suborderId);
      if (!order || !parcel) return { success: false, message: "Parcel not found" };
      if (!canCancelSuborder(parcel))
        return { success: false, message: "This parcel is already with the courier" };

      set({ saving: true });
      // TODO(api): await ordersApi.cancelSuborder(orderId, suborderId, { reason });
      const suborders = order.suborders.map((s) =>
        s.id === suborderId
          ? { ...s, status: "CANCELLED" as const, cancelledBy: "ADMIN" as const, cancelReason: reason.trim() }
          : s,
      );
      const updated: Order = {
        ...order,
        suborders,
        events: [...order.events, event(order, `${parcel.sellerName} parcel cancelled`, reason.trim())],
      };
      const status = deriveOrderStatus(updated);
      replace({
        ...updated,
        status,
        ...(status === "CANCELLED"
          ? { cancelledBy: "ADMIN" as const, cancelReason: reason.trim(), cancelledAt: new Date().toISOString() }
          : {}),
      });
      set({ saving: false });
      return { success: true, message: `${parcel.sellerName} parcel cancelled` };
    },
  };
});
