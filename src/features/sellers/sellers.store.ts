import { create } from "zustand";
import {
  Seller,
  SellerReviewAction,
  SellersFilter,
  CreateSellerDto,
  UpdateSellerDto,
} from "./sellers.types";
import { SELLERS_MOCK } from "./sellers.mock";
import {
  hasAllRequiredDocuments,
  NOTE_REQUIRED_ACTIONS,
  REQUIRED_KYB_DOCUMENTS,
  reviewActionResultMap,
} from "./sellers.helpers";

type Result = { success: boolean; message: string };

type SellersStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Full list from the source; `sellers` is the filtered view. */
  allSellers: Seller[];
  sellers: Seller[];
  total: number;

  fetchSellers: (filter?: SellersFilter, search?: string) => Promise<void>;
  createSeller: (dto: CreateSellerDto) => Promise<Result & { id?: string }>;
  updateSeller: (id: string, dto: UpdateSellerDto) => Promise<Result>;
  reviewSeller: (
    id: string,
    action: SellerReviewAction,
    note?: string,
  ) => Promise<Result>;
};

const applyFilter = (list: Seller[], filter?: SellersFilter, search?: string) => {
  const q = search?.trim().toLowerCase();
  return list.filter(
    (b) =>
      (!filter?.status || b.status === filter.status) &&
      (!filter?.tier || b.tier === filter.tier) &&
      (!q ||
        b.name.toLowerCase().includes(q) ||
        b.legalName.toLowerCase().includes(q)),
  );
};

export const useSellersStore = create<SellersStore>((set, get) => {
  // Remember the last query so mutations can refresh the filtered view.
  let lastFilter: SellersFilter | undefined;
  let lastSearch: string | undefined;

  const commit = (allSellers: Seller[]) => {
    const sellers = applyFilter(allSellers, lastFilter, lastSearch);
    set({ allSellers, sellers, total: sellers.length });
  };

  return {
    loading: false,
    saving: false,
    error: null,
    allSellers: [],
    sellers: [],
    total: 0,

    fetchSellers: async (filter, search) => {
      lastFilter = filter;
      lastSearch = search;
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await sellersApi.getSellers(page, limit, filter, search);
        const source = get().allSellers.length ? get().allSellers : SELLERS_MOCK;
        commit(source);
        set({ loading: false });
      } catch (e: any) {
        const message = e?.response?.data?.message ?? "Something went wrong";
        set({ error: message, loading: false });
      }
    },

    createSeller: async (dto) => {
      const { allSellers } = get();
      if (allSellers.some((b) => b.name.toLowerCase() === dto.name.toLowerCase())) {
        return { success: false, message: "A seller with this name already exists" };
      }
      set({ saving: true });
      // TODO(api): upload each file (multipart), then
      // const res = await sellersApi.createSeller({ ...fields, documents: uploadedRefs });
      const id = `seller-${Date.now()}`;
      const { documents: uploads, tier, ...fields } = dto;
      const uploaded = uploads.map((u, i) => ({
        id: `${id}-doc-${i}`,
        type: u.type,
        title: u.title,
        fileName: u.file.name,
        url: URL.createObjectURL(u.file),
        status: "UPLOADED" as const,
      }));
      // Any required document not picked shows as missing.
      const missing = REQUIRED_KYB_DOCUMENTS.filter(
        (type) => !uploads.some((u) => u.type === type),
      ).map((type) => ({ id: `${id}-${type}`, type, status: "MISSING" as const }));
      commit([
        {
          ...fields,
          id,
          tier: tier ?? "STANDARD",
          productCount: 0,
          status: "KYB_PENDING",
          documents: [...uploaded, ...missing],
          createdAt: new Date().toISOString(),
        },
        ...allSellers,
      ]);
      set({ saving: false });
      return { success: true, message: `${dto.name} added`, id };
    },

    updateSeller: async (id, dto) => {
      set({ saving: true });
      // TODO(api): const res = await sellersApi.updateSeller(id, dto);
      commit(get().allSellers.map((b) => (b.id === id ? { ...b, ...dto } : b)));
      set({ saving: false });
      return { success: true, message: "Seller updated" };
    },

    reviewSeller: async (id, action, note) => {
      if (NOTE_REQUIRED_ACTIONS.includes(action) && !note?.trim()) {
        return { success: false, message: "Add a review note so the seller knows why" };
      }
      const seller = get().allSellers.find((b) => b.id === id);
      if (!seller) return { success: false, message: "Seller not found" };
      if (action === "APPROVE" && !hasAllRequiredDocuments(seller.documents)) {
        return { success: false, message: "All required KYB documents must be uploaded first" };
      }

      set({ saving: true });
      // TODO(api): const res = await sellersApi.reviewSeller(id, { action, note });
      const status = reviewActionResultMap[action];
      commit(
        get().allSellers.map((b) =>
          b.id === id ? { ...b, status, reviewNote: note?.trim() || null } : b,
        ),
      );
      set({ saving: false });
      return { success: true, message: `${seller.name}: status updated` };
    },
  };
});
