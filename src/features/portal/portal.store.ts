import { create } from "zustand";
import { portalApi } from "./portal.api";
import { ServiceModule } from "./portal.types";

type PortalStore = {
  services: ServiceModule[];
  loading: boolean;
  error: string | null;

  fetchServices: () => Promise<void>;
};

export const usePortalStore = create<PortalStore>((set) => ({
  services: [],
  loading: false,
  error: null,

  fetchServices: async () => {
    set({ loading: true, error: null });

    try {
      const res = await portalApi.getServiceModules();

      if (!res.status || !res.data) {
        set({
          error: res.message ?? "Failed to load services",
          loading: false,
        });
        return;
      }

      set({
        services: res.data.rows,
        loading: false,
      });
    } catch (e: any) {
      set({
        error: e?.response?.data?.message ?? "Something went wrong",
        loading: false,
      });
    }
  },
}));
