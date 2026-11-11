import { create } from "zustand";
import { Product, ProductsFilter, SaveProductDto } from "./products.types";
import { PRODUCTS_MOCK } from "./products.mock";

type Result = { success: boolean; message: string };

/** Names are denormalised on the product row, as the list API will return them. */
type SaveMeta = { sellerName: string; categoryName: string };

type ProductsStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  allProducts: Product[];
  /** Current page of the filtered list. */
  products: Product[];
  /** Total rows matching the filter (all pages). */
  total: number;
  page: number;
  limit: number;
  product: Product | null;

  fetchProducts: (
    page?: number,
    limit?: number,
    filter?: ProductsFilter,
    search?: string,
  ) => Promise<void>;
  getProductById: (id: string) => Promise<void>;
  createProduct: (dto: SaveProductDto, meta: SaveMeta) => Promise<Result & { id?: string }>;
  updateProduct: (id: string, dto: SaveProductDto, meta: SaveMeta) => Promise<Result>;
  approveProduct: (id: string) => Promise<Result>;
  rejectProduct: (id: string, reason: string) => Promise<Result>;
};

const applyFilter = (list: Product[], filter?: ProductsFilter, search?: string) => {
  const q = search?.trim().toLowerCase();
  return list.filter(
    (p) =>
      (!filter?.status || p.status === filter.status) &&
      (!filter?.sellerId || p.sellerId === filter.sellerId) &&
      (!filter?.categoryId || p.categoryId === filter.categoryId) &&
      (!q ||
        p.name.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q))),
  );
};

export const useProductsStore = create<ProductsStore>((set, get) => {
  let lastFilter: ProductsFilter | undefined;
  let lastSearch: string | undefined;

  const DEFAULT_LIMIT = 10;

  const source = () => (get().allProducts.length ? get().allProducts : PRODUCTS_MOCK);

  // Mirrors what a paginated API returns: one page of rows plus the total.
  const commit = (allProducts: Product[], page = get().page, limit = get().limit) => {
    const filtered = applyFilter(allProducts, lastFilter, lastSearch);
    const lastPage = Math.max(1, Math.ceil(filtered.length / limit));
    const safePage = Math.min(page, lastPage);
    set({
      allProducts,
      products: filtered.slice((safePage - 1) * limit, safePage * limit),
      total: filtered.length,
      page: safePage,
      limit,
    });
  };

  const patch = (id: string, changes: Partial<Product>) =>
    commit(source().map((p) => (p.id === id ? { ...p, ...changes } : p)));

  return {
    loading: false,
    saving: false,
    error: null,
    allProducts: [],
    products: [],
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    product: null,

    fetchProducts: async (page = 1, limit = DEFAULT_LIMIT, filter, search) => {
      lastFilter = filter;
      lastSearch = search;
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await productsApi.getProducts(page, limit, filter, search);
        // set({ products: res.data.rows, total: res.data.meta.total, page, limit });
        commit(source(), page, limit);
        set({ loading: false });
      } catch (e: any) {
        const message = e?.response?.data?.message ?? "Something went wrong";
        set({ error: message, loading: false });
      }
    },

    getProductById: async (id) => {
      set({ loading: true, error: null, product: null });
      // TODO(api): const res = await productsApi.getProductById(id);
      const product = source().find((p) => p.id === id) ?? null;
      set({
        product,
        loading: false,
        error: product ? null : "Product not found",
      });
    },

    createProduct: async (dto, meta) => {
      set({ saving: true });
      // TODO(api): const res = await productsApi.createProduct(dto);
      const id = `p-${Date.now()}`;
      commit([
        {
          ...dto,
          ...meta,
          id,
          addedBy: "STAFF",
          rejectionReason: null,
          createdAt: new Date().toISOString(),
        },
        ...source(),
      ]);
      set({ saving: false });
      return {
        success: true,
        message: dto.status === "APPROVED" ? "Product saved and live" : "Draft saved",
        id,
      };
    },

    updateProduct: async (id, dto, meta) => {
      set({ saving: true });
      // TODO(api): const res = await productsApi.updateProduct(id, dto);
      patch(id, { ...dto, ...meta, rejectionReason: null });
      set({ saving: false });
      return { success: true, message: "Product updated" };
    },

    approveProduct: async (id) => {
      set({ saving: true });
      // TODO(api): const res = await productsApi.approveProduct(id);
      patch(id, { status: "APPROVED", rejectionReason: null });
      set({ saving: false });
      return { success: true, message: "Product approved" };
    },

    rejectProduct: async (id, reason) => {
      if (!reason.trim()) {
        return { success: false, message: "A rejection reason is required" };
      }
      set({ saving: true });
      // TODO(api): const res = await productsApi.rejectProduct(id, reason);
      patch(id, { status: "REJECTED", rejectionReason: reason.trim() });
      set({ saving: false });
      return { success: true, message: "Product rejected" };
    },
  };
});
