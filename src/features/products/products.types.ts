export type ProductStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

/** Who created the listing: the seller itself or Aariy staff on its behalf. */
export type ProductAddedBy = "SELLER" | "STAFF";

export type ProductVariant = {
  id: string;
  size: string;
  colour: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
};

export type SizeChartRow = {
  size: string;
  chest: string;
  length: string;
};

export type Product = {
  id: string;
  name: string;
  sellerId: string;
  sellerName: string;
  categoryId: string;
  categoryName: string;
  description: string;
  material?: string;
  dispatchLeadTimeDays?: number;
  variants: ProductVariant[];
  images: string[];
  sizeChart: SizeChartRow[];
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

export type SaveProductDto = {
  name: string;
  sellerId: string;
  categoryId: string;
  description: string;
  material?: string;
  dispatchLeadTimeDays?: number;
  variants: ProductVariant[];
  images: string[];
  sizeChart: SizeChartRow[];
  /** DRAFT = seller finishes it; APPROVED = live immediately. */
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
