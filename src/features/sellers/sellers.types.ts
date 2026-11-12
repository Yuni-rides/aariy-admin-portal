export type SellerStatus =
  | "KYB_PENDING"
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "SUSPENDED";

export type SellerTier = "STANDARD" | "PREMIUM";

export type KybDocumentType =
  | "CNIC_FRONT"
  | "CNIC_BACK"
  | "TAX_CERTIFICATE"
  | "SALES_TAX_CERTIFICATE"
  | "BANK_PROOF"
  | "BRAND_AUTHORIZATION"
  /** Any extra supporting document; a seller can have several. */
  | "OTHER";

export type KybDocumentStatus = "UPLOADED" | "MISSING" | "REJECTED";

export type KybDocument = {
  /** Unique per seller; needed because there can be several OTHER documents. */
  id: string;
  type: KybDocumentType;
  status: KybDocumentStatus;
  /** Label for OTHER documents, e.g. "Trademark certificate". */
  title?: string;
  fileName?: string;
  url?: string | null;
};

/** A file picked in the form, before it is uploaded. */
export type KybDocumentUpload = {
  type: KybDocumentType;
  title?: string;
  file: File;
};

export type Seller = {
  id: string;
  name: string;
  legalName: string;
  contactEmail: string;
  contactPhone: string;
  /** CNIC (Pakistan) or SSN of the owner / authorised person. */
  idNumber: string;
  ntnNumber: string;
  productCount: number;
  tier: SellerTier;
  status: SellerStatus;
  documents: KybDocument[];
  reviewNote?: string | null;
  createdAt: string;
  /** Storefront brand page is /brands/{slug}. */
  slug?: string;
  logoUrl?: string | null;
  /** Average buyer rating and number of ratings, shown on the home banner. */
  rating?: number | null;
  reviewCount?: number | null;
  /** Sale the seller is running from the seller portal; such brands can fill the home banner. */
  activeSale?: SellerSale | null;
};

export type SellerSale = {
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
};

export type SellersFilter = {
  status?: SellerStatus;
  tier?: SellerTier;
};

export type CreateSellerDto = {
  /** Brand name shown on the storefront. */
  name: string;
  legalName: string;
  contactEmail: string;
  contactPhone: string;
  idNumber: string;
  ntnNumber: string;
  /** Defaults to STANDARD; tiers are managed separately. */
  tier?: SellerTier;
  documents: KybDocumentUpload[];
};

export type UpdateSellerDto = Partial<Omit<CreateSellerDto, "documents">>;

/** Decisions a super admin can take on a seller. */
export type SellerReviewAction =
  | "APPROVE"
  | "REQUEST_CHANGES"
  | "REJECT"
  | "SUSPEND"
  | "REACTIVATE";

export type SellerResponse = {
  status: boolean;
  message: string;
  data?: { id: string };
};

export type GetSellersResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: Seller[];
    meta: { total: number; page: number; limit: number };
  };
};
