export type ProductStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

/** Who created the listing: the seller itself or Aariy staff on its behalf. */
export type ProductAddedBy = "SELLER" | "STAFF";

export type ProductVariant = {
  id: string;
  /** Value of the first variant field (usually size); kept for lists and search. */
  size: string;
  colour: string;
  sku: string;
  barcode?: string;
  /** In rupees. TODO(api): sent as priceMinor = price × 100. */
  price: number;
  /** "Original" price shown struck through; must be above price. TODO(api): compareAtMinor. */
  compareAtPrice?: number | null;
  /** TODO(api): stockOnHand. */
  stock: number;
  /** Values of the category's variant fields, by field code (e.g. { size: "M" }). */
  options?: Record<string, string>;
};

/** Value of one category field (Product details). */
export type AttributeValue = string | number | boolean | string[];

/** Needed only before a product can ship abroad. */
export type ProductCustoms = {
  hsCode?: string;
  fibreContent?: string;
  /** ISO country code, e.g. "PK". */
  countryOfOrigin?: string;
  /** In rupees. TODO(api): declaredValueMinor = × 100. */
  declaredValue?: number | null;
};

/**
 * Search engine fields. Empty meta fields fall back on the storefront to
 * "<name> by <seller>" and the first 155 characters of the description.
 */
export type ProductSeo = {
  /**
   * Storefront URL: /products/<slug>. Read-only: the backend makes it from
   * seller + name on create (adding -2, -3… if taken) and keeps it when the
   * product is renamed.
   */
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
};

/** The slug is never sent; the backend owns it. */
type SaveSeo = Omit<ProductSeo, "slug">;

export type Product = ProductSeo & {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  /** Each seller has one brand; the product belongs to it. */
  brandId?: string | null;
  brandName?: string | null;
  categoryId: string;
  categoryName: string;
  description: string;
  material?: string;
  care?: string;
  /** Days until it is dispatched, as a range (0 to 60). */
  dispatchMinDays?: number | null;
  dispatchMaxDays?: number | null;
  /** Category field values, by field code (non-variant fields only). */
  attributes?: Record<string, AttributeValue>;
  variants: ProductVariant[];
  /** Photo URLs, cover first. */
  images: string[];
  /** Uploaded media keys in the same order as images. TODO(api): sent as imageKeys[]. */
  imageKeys?: string[];
  /** Brand size chart used by this product. */
  sizeChartId?: string | null;
  customs?: ProductCustoms | null;
  addedBy: ProductAddedBy;
  status: ProductStatus;
  rejectionReason?: string | null;
  createdAt: string;
};

export type ProductsFilter = {
  status?: ProductStatus;
  sellerId?: string;
  categoryId?: string;
};

export type SaveProductDto = SaveSeo & {
  name: string;
  sellerId: string;
  brandId?: string | null;
  categoryId: string;
  description: string;
  material?: string;
  care?: string;
  dispatchMinDays?: number | null;
  dispatchMaxDays?: number | null;
  attributes?: Record<string, AttributeValue>;
  variants: ProductVariant[];
  images: string[];
  imageKeys?: string[];
  sizeChartId?: string | null;
  customs?: ProductCustoms | null;
  /** DRAFT = "Save draft" (publish: false); APPROVED = "Save & publish", live at once (publish: true). */
  status: Extract<ProductStatus, "DRAFT" | "APPROVED">;
};

export type ProductResponse = {
  status: boolean;
  message: string;
  data?: { id: string };
};

export type GetProductsResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: Product[];
    meta: { total: number; page: number; limit: number };
  };
};
