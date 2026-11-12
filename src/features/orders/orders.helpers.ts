import type { StatusTone } from "@/components/ui/StatusBadge";
import {
  ConfirmationOutcome,
  Order,
  OrderStatus,
  OrderTab,
  PaymentStatus,
  Suborder,
  SuborderStatus,
} from "./orders.types";

export const orderStatusLabelMap: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Awaiting confirmation",
  CONFIRMED: "Confirmed",
  PARTIALLY_CANCELLED: "Partially cancelled",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const orderStatusToneMap: Record<OrderStatus, StatusTone> = {
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "info",
  PARTIALLY_CANCELLED: "danger",
  CANCELLED: "danger",
  COMPLETED: "success",
};

export const suborderStatusLabelMap: Record<SuborderStatus, string> = {
  AWAITING_CONFIRMATION: "Awaiting",
  NEW: "New",
  ACCEPTED: "Accepted",
  READY_FOR_PICKUP: "Ready for pickup",
  PICKED_UP: "Picked up",
  DELIVERED: "Delivered",
  REJECTED: "Rejected by seller",
  CANCELLED: "Cancelled",
  DELIVERY_FAILED: "Delivery failed",
};

export const suborderStatusToneMap: Record<SuborderStatus, StatusTone> = {
  AWAITING_CONFIRMATION: "warning",
  NEW: "info",
  ACCEPTED: "info",
  READY_FOR_PICKUP: "info",
  PICKED_UP: "info",
  DELIVERED: "success",
  REJECTED: "danger",
  CANCELLED: "danger",
  DELIVERY_FAILED: "danger",
};

export const paymentStatusLabelMap: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export const callOutcomeLabelMap: Record<ConfirmationOutcome, string> = {
  CONFIRMED: "Customer confirmed",
  NO_ANSWER: "No answer",
  WRONG_NUMBER: "Wrong number",
  CUSTOMER_DECLINED: "Customer declined",
  CALLBACK_REQUESTED: "Call back later",
};

export const callOutcomeToneMap: Record<ConfirmationOutcome, StatusTone> = {
  CONFIRMED: "success",
  NO_ANSWER: "warning",
  WRONG_NUMBER: "danger",
  CUSTOMER_DECLINED: "danger",
  CALLBACK_REQUESTED: "info",
};

/** Outcome buttons in the order the design shows them. */
export const CALL_OUTCOME_ACTIONS: { outcome: ConfirmationOutcome; label: string }[] = [
  { outcome: "CONFIRMED", label: "Customer confirmed" },
  { outcome: "NO_ANSWER", label: "No answer" },
  { outcome: "WRONG_NUMBER", label: "Wrong number" },
  { outcome: "CUSTOMER_DECLINED", label: "Customer declined, cancel" },
];

export const ORDER_TABS: { value: OrderTab; label: string }[] = [
  { value: "PENDING_CONFIRMATION", label: "Pending confirmation" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PARTIALLY_CANCELLED", label: "Partially cancelled" },
  { value: "ALL", label: "All" },
];

export const matchesTab = (o: Order, tab: OrderTab = "ALL") =>
  tab === "ALL" || o.status === tab;

/** A parcel can still be cancelled until the courier has picked it up. */
const CANCELLABLE: SuborderStatus[] = [
  "AWAITING_CONFIRMATION",
  "NEW",
  "ACCEPTED",
  "READY_FOR_PICKUP",
];
export const canCancelSuborder = (s: Suborder) => CANCELLABLE.includes(s.status);

const CLOSED: SuborderStatus[] = ["CANCELLED", "REJECTED"];
export const isSuborderClosed = (s: Suborder) => CLOSED.includes(s.status);

export const canCancelOrder = (o: Order) =>
  o.status !== "CANCELLED" &&
  o.status !== "COMPLETED" &&
  o.suborders.some(canCancelSuborder) &&
  o.suborders.every((s) => canCancelSuborder(s) || isSuborderClosed(s));

/** Order status that follows from its parcels after a confirmation or cancellation. */
export function deriveOrderStatus(o: Order): OrderStatus {
  const open = o.suborders.filter((s) => !isSuborderClosed(s));
  if (open.length === 0) return "CANCELLED";
  if (o.status === "PENDING_CONFIRMATION") return "PENDING_CONFIRMATION";
  if (open.every((s) => s.status === "DELIVERED"))
    return open.length === o.suborders.length ? "COMPLETED" : "PARTIALLY_CANCELLED";
  return open.length === o.suborders.length ? "CONFIRMED" : "PARTIALLY_CANCELLED";
}

export const parcelSummary = (o: Order) =>
  `${o.suborders.length} ${o.suborders.length === 1 ? "parcel" : "parcels"}`;

/** "Call again" once a call has already been tried without a confirmation. */
export const callButtonLabel = (o: Order) => (o.calls.length ? "Call again" : "Call");

export const itemsSummary = (s: Suborder) =>
  s.items.map((i) => `${i.name} × ${i.qty}`).join(", ");

export const formatOrderTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";
