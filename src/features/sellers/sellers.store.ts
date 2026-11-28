import { create } from "zustand";
import { sellersApi } from "./seller.api";
import {
  Seller,
  SellerReviewAction,
  SellersFilter,
  CreateSellerDto,
  UpdateSellerDto,
  SellerCounts,
  GetSellersParams,
  SellerStatus,
  CountryItem,
  ProvinceItem,
  CityItem,
} from "./sellers.types";

type Result = { success: boolean; message: string };

type SellersState = {
  sellers: Seller[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  counts: SellerCounts;
  filters: SellersFilter & { search?: string };
  loading: boolean;
  saving: boolean;
  error: string | null;
  selectedSeller: Seller | null;

countries: CountryItem[];
loadingCountries: boolean;

provinces: ProvinceItem[];
loadingProvinces: boolean;

loadingSubmit: boolean;
fetchProvinces: (params: {
  countryCode: string;
  page?: number;
  limit?: number;
}) => Promise<void>;

cities: CityItem[];
loadingCities: boolean;
fetchCities: (params: {
  regionId: string;
  page?: number;
  limit?: number;
}) => Promise<void>;


fetchCountries: (params?: { page?: number; limit?: number }) => Promise<void>;


  fetchSellers: (params?: GetSellersParams) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setSearch: (search: string) => Promise<void>;
  setStatusFilter: (status?: SellerStatus) => Promise<void>;

  createSeller: (dto: CreateSellerDto) => Promise<Result & { id?: string }>;
  updateSeller: (id: string, dto: UpdateSellerDto) => Promise<Result>;
  reviewSeller: (
    id: string,
    action: SellerReviewAction,
    note?: string
  ) => Promise<Result>;

  fetchSellerById: (id: string) => Promise<void>;

  
};

export const useSellersStore = create<SellersState>((set, get) => ({
  sellers: [],
  meta: {
    page: 1,
    limit: 10,
    total: 0,
  },
  counts: {
    ALL: 0,
    ONBOARDING: 0,
    SUBMITTED: 0,
    CHANGES_REQUESTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    SUSPENDED: 0,
  },
  filters: {},
  loading: false,
  saving: false,
  error: null,
  selectedSeller: null,

 // Initial state mein:
countries: [],
loadingCountries: false,


provinces: [],
loadingProvinces: false,
loadingSubmit:false,
cities: [],
loadingCities: false,

  fetchSellers: async (params) => {
    const state = get();
    const page = Number(params?.page) || state.meta.page || 1;
    const limit = Number(params?.limit) || state.meta.limit || 10;
    const search =
      params?.search !== undefined ? params.search : state.filters.search;
    const status =
      params && "status" in params ? params.status : state.filters.status;
    const tier =
      params && "tier" in params ? params.tier : state.filters.tier;

    set({
      loading: true,
      error: null,
      filters: { search, status, tier },
    });

    try {
      const res = await sellersApi.getSellers({
        page,
        limit,
        search,
        status,
        tier,
      });

      if (!res.status) {
        set({
          loading: false,
          error: res.message || "Failed to fetch sellers",
        });
        return;
      }

      set({
        sellers: res.rows,
        meta: res.meta,
        counts: res.counts,
        loading: false,
      });
    } catch (e: unknown) {
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to fetch sellers";

      set({ loading: false, error: message });
    }
  },

  setPage: async (page: number) => {
    await get().fetchSellers({
      page,
      limit: get().meta.limit,
    });
  },

  setSearch: async (search: string) => {
    await get().fetchSellers({
      page: 1,
      search,
    });
  },

  setStatusFilter: async (status?: SellerStatus) => {
    await get().fetchSellers({
      page: 1,
      status,
    });
  },

  // TODO: Wire with POST /admin/sellers once endpoint response is shared
createSeller: async (dto: CreateSellerDto): Promise<Result & { id?: string }> => {
  set({ loadingSubmit: true, error: null });
  try {
    const res = await sellersApi.createSeller(dto);

    if (res && res.status === false) {
      return {
        success: false,
        message: res.message || "Failed to create seller",
      };
    }

    const createdId = res?.data?.id ?? res?.data?.sellerId ?? res?.id;

    const { meta, fetchSellers } = get();
    await fetchSellers({
      page: meta.page || 1,
      limit: meta.limit || 10,
    });

    return {
      success: true,
      message: res?.message || "Seller created successfully.",
      id: createdId,
    };
  } catch (e: unknown) {
    const errData = (
      e as { response?: { data?: { message?: string | string[] } } }
    )?.response?.data;

    const message = Array.isArray(errData?.message)
      ? errData.message.join(", ")
      : errData?.message ??
        (e instanceof Error ? e.message : "Failed to create seller");

    return {
      success: false,
      message,
    };
  } finally {
    set({ loadingSubmit: false });
  }
},

  // TODO: Wire with PATCH /admin/sellers/:id once endpoint response is shared
  updateSeller: async (_id, _dto) => {
    return { success: false, message: "Update seller API not connected yet" };
  },

  // TODO: Wire with POST /admin/sellers/:id/review once endpoint response is shared
reviewSeller: async (id, action, note) => {
    const trimmedNote = note?.trim() ?? "";

    // Client-side validation for actions requiring a note
    if (
      // (action === "REQUEST_CHANGES" ||
      //   action === "REJECTED" ||
      //   action === "SUSPEND") &&
      !trimmedNote
    ) {
      return {
        success: false,
        message: "Please add a review note before submitting this action.",
      };
    }

    set({ saving: true, error: null });

    try {
      const res = await sellersApi.reviewSeller(id, action, trimmedNote);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to submit decision",
        };
      }

      // List aur agar yehi seller detail mein khula hai to usay refresh karein
      await get().fetchSellers();
      if (get().selectedSeller?.id === id) {
        await get().fetchSellerById(id);
      }

      set({ saving: false });
      return {
        success: true,
        message: res.message || "Seller status updated",
      };
    } catch (e: unknown) {
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to update seller status";

      set({ saving: false });
      return { success: false, message };
    }
  },

  fetchSellerById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await sellersApi.getSellerById(id);

      if (!res.status || !res.seller) {
        set({
          selectedSeller: null,
          loading: false,
          error: res.message || "Seller not found",
        });
        return;
      }

      set({
        selectedSeller: res.seller,
        loading: false,
      });
    } catch (e: unknown) {
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to load seller details";

      set({ selectedSeller: null, loading: false, error: message });
    }
  },

// Action mein:
fetchCountries: async (params) => {
  set({ loadingCountries: true });
  try {
    const list = await sellersApi.getCountries({
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    });
    set({ countries: list, loadingCountries: false });
  } catch {
    set({ countries: [], loadingCountries: false });
  }
},


// 3. Action mein add karein:
fetchProvinces: async (params) => {
  if (!params?.countryCode?.trim()) {
    set({ provinces: [], loadingProvinces: false });
    return;
  }

  set({ loadingProvinces: true });
  try {
    const list = await sellersApi.getProvinces({
      countryCode: params.countryCode.trim(),
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    });
    set({ provinces: list, loadingProvinces: false });
  } catch {
    set({ provinces: [], loadingProvinces: false });
  }
},


fetchCities: async (params) => {
  if (!params?.regionId?.trim()) {
    set({ cities: [], loadingCities: false });
    return;
  }

  set({ loadingCities: true });
  try {
    const list = await sellersApi.getCities({
      regionId: params.regionId.trim(),
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    });
    set({ cities: list, loadingCities: false });
  } catch {
    set({ cities: [], loadingCities: false });
  }
},
}));