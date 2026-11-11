import type { StatusTone } from "@/components/ui/StatusBadge";
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
