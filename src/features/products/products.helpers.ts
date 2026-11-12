import type { StatusTone } from "@/components/ui/StatusBadge";
import { slugify } from "@/lib/format";
import { Product, ProductStatus } from "./products.types";

export const productStatusLabelMap: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const productStatusToneMap: Record<ProductStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export const PRODUCT_TABS: { value: ProductStatus | "ALL"; label: string }[] = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

/** Lowest variant price, which is what the storefront shows as "from". */
export const getProductPrice = (p: Pick<Product, "variants">) =>
  p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;

export const getProductSummary = (p: Product) => {
  const parts = [
    `${p.variants.length} variant${p.variants.length === 1 ? "" : "s"}`,
    p.sizeChart.length ? "size chart added" : "no size chart",
    `${p.images.length} image${p.images.length === 1 ? "" : "s"}`,
  ];
  return parts.join(" · ");
};

export const AFTER_SAVE_OPTIONS = [
  { value: "APPROVED", label: "Approved and live" },
  { value: "DRAFT", label: "Draft for the seller to finish" },
] as const;

export const MAX_PRODUCT_IMAGES = 8;

export const newVariantId = () =>
  `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ── Search engine (SEO) fields ────────────────────────────────────────────

/** Where products live on the storefront; used for the search preview. */
export const STOREFRONT_ORIGIN = "https://www.aariee.com";

/** Roughly what Google shows before cutting the text off with "…". */
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

export const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** e.g. "Kapra Co" + "Space print night suit" → "kapra-co-space-print-night-suit". */
export const productSlug = (sellerName: string, name: string) =>
  slugify(`${sellerName} ${name}`).replace(/^-+|-+$/g, "");

export const productUrl = (slug: string) => `${STOREFRONT_ORIGIN}/products/${slug}`;

/** What the storefront uses when the meta title is left empty. */
export const defaultMetaTitle = (name: string, sellerName: string) =>
  name.trim() ? (sellerName ? `${name.trim()} by ${sellerName}` : name.trim()) : "";

/** What the storefront uses when the meta description is left empty. */
export const defaultMetaDescription = (description: string) =>
  description.replace(/s+/g, " ").trim().slice(0, META_DESCRIPTION_MAX);

/** Cuts text the way a search result would, so the preview looks real. */
export const truncateForPreview = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
