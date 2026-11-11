import { create } from "zustand";
import { DashboardData } from "./dashboard.types";
import { DASHBOARD_MOCK } from "./dashboard.mock";

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
      set({ data: DASHBOARD_MOCK, loading: false });
    } catch (e: any) {
      const message = e?.response?.data?.message ?? "Something went wrong";
      set({ error: message, loading: false });
    }
  },
}));
