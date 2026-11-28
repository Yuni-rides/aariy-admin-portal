import { create } from "zustand";
import { useOrdersStore } from "@/features/orders/orders.store";
import { useSellersStore } from "@/features/sellers/sellers.store";
import { useProductsStore } from "@/features/products/products.store";
import { ORDERS_MOCK } from "@/features/orders/orders.mock";
import { PRODUCTS_MOCK } from "@/features/products/products.mock";
import { DashboardData } from "./dashboard.types";
import { buildDashboard, SELLERS_MOCK } from "./dashboard.mock";

type DashboardStore = {
  loading: boolean;
  error: string | null;
  data: DashboardData | null;

  fetchDashboard: () => Promise<void>;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  loading: false,
  error: null,
  data: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });

    try {
      // TODO(api): const res = await dashboardApi.getDashboard();
      // if (!res.status) { set({ error: res.message, loading: false }); return; }
      // set({ data: res.data!, loading: false });
      // The backend must count with the same status filters as the list endpoints (see DashboardStats).
      const orders = useOrdersStore.getState().allOrders;
      const sellers = useSellersStore.getState().sellers;
      const products = useProductsStore.getState().allProducts;

      set({
        data: buildDashboard(
          orders.length ? orders : ORDERS_MOCK,
          sellers.length ? sellers : SELLERS_MOCK,
          products.length ? products : PRODUCTS_MOCK,
        ),
        loading: false,
      });
    } catch (e: any) {
      const message = e?.response?.data?.message ?? "Something went wrong";
      set({ error: message, loading: false });
    }
  },
}));