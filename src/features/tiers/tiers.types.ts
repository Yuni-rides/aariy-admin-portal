/** Which suborders a commission tier applies to. Priority: seller, category, default. */
export type CommissionScope = "DEFAULT" | "CATEGORY" | "SELLER";

export type CommissionRuleStatus = "DRAFT" | "APPROVED" | "RETIRED";
export type TaxRuleStatus = "DRAFT" | "PUBLISHED" | "RETIRED";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Maker-checker record: the approver must be a different person from the requester. */
export type Approval = {
  status: ApprovalStatus;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string | null;
  decidedAt?: string | null;
  reason?: string | null;
};

export type CommissionRule = {
  id: string;
  scope: CommissionScope;
  sellerId?: string | null;
  sellerName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  /** Basis points: 1250 = 12.5%. */
  rateBps: number;
  /** YYYY-MM-DD */
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: CommissionRuleStatus;
  approval?: Approval | null;
  /** The rule this one replaces once approved. */
  replacesId?: string | null;
};

export type SellerType = "SOLE_PROP" | "AOP" | "COMPANY";

export type TaxRule = {
  id: string;
  province: string;
  sellerType: SellerType;
  /** e.g. "Sales tax", "Withholding tax" — set from the tax adviser's opinion. */
  taxType: string;
  rateBps: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: TaxRuleStatus;
  approval?: Approval | null;
  replacesId?: string | null;
};

export type SaveCommissionRuleDto = {
  scope: CommissionScope;
  sellerId?: string | null;
  categoryId?: string | null;
  rateBps: number;
  effectiveFrom: string;
  /** false = keep as draft; true = send to a second approver. */
  submit: boolean;
};

export type SaveTaxRuleDto = {
  province: string;
  sellerType: SellerType;
  taxType: string;
  rateBps: number;
  effectiveFrom: string;
  submit: boolean;
};

export type TiersResponse = {
  status: boolean;
  message: string;
  data?: { commissionRules: CommissionRule[]; taxRules: TaxRule[] };
};
