import { create } from "zustand";
import { Product, ProductsFilter, SaveProductDto } from "./products.types";
import { PRODUCTS_MOCK } from "./products.mock";
import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  productSlug,
} from "./products.helpers";

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

/**
 * Stand-in for what the backend does on save: checks the meta fields, creates a
 * unique slug for a new product (an existing product keeps its slug), and drops
 * empty meta fields so the storefront uses its defaults.
 */
const checkSeo = (
  dto: SaveProductDto,
  others: Product[],
  meta: SaveMeta,
  /** Slug the product already has (edit only); it never changes. */
  currentSlug?: string,
): { error: string } | { seo: Pick<Product, "slug" | "metaTitle" | "metaDescription"> } => {
  const metaTitle = dto.metaTitle?.trim() || undefined;
  const metaDescription = dto.metaDescription?.replace(/\s+/g, " ").trim() || undefined;
  const taken = (s: string) => others.some((p) => p.slug === s);

  let slug = currentSlug ?? "";
  if (!slug) {
    // TODO(api): the backend does this; remove once products.api.ts is wired in.
    const base = productSlug(meta.sellerName, dto.name) || "product";
    slug = base;
    for (let n = 2; taken(slug); n++) slug = `${base}-${n}`;
  }
  if (metaTitle && metaTitle.length > META_TITLE_MAX)
    return { error: `Meta title must be ${META_TITLE_MAX} characters or fewer` };
  if (metaDescription && metaDescription.length > META_DESCRIPTION_MAX)
    return { error: `Meta description must be ${META_DESCRIPTION_MAX} characters or fewer` };
  return { seo: { slug, metaTitle, metaDescription } };
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
      const check = checkSeo(dto, source(), meta);
      if ("error" in check) return { success: false, message: check.error };
      set({ saving: true });
      // TODO(api): const res = await productsApi.createProduct(dto);
      const id = `p-${Date.now()}`;
      commit([
        {
          ...dto,
          ...meta,
          ...check.seo,
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
      const current = source().find((p) => p.id === id);
      const check = checkSeo(dto, source().filter((p) => p.id !== id), meta, current?.slug);
      if ("error" in check) return { success: false, message: check.error };
      set({ saving: true });
      // TODO(api): const res = await productsApi.updateProduct(id, dto);
      patch(id, { ...dto, ...meta, ...check.seo, rejectionReason: null });
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
