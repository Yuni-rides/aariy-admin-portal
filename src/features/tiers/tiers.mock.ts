// TEMPORARY: mock data until the tiers API is ready.
// Delete this file once tiers.api.ts is wired into the store.
// Rates are placeholders; the real ones come from finance and the tax adviser.
import { CommissionRule, TaxRule } from "./tiers.types";

const FINANCE = "Sara Malik (Finance)";

export const COMMISSION_RULES_MOCK: CommissionRule[] = [
  {
    id: "cr-default-2",
    scope: "DEFAULT",
    rateBps: 1500,
    effectiveFrom: "2026-07-01",
    status: "APPROVED",
    approval: {
      status: "APPROVED",
      requestedBy: FINANCE,
      requestedAt: "2026-06-20T10:00:00Z",
      decidedBy: "Test Admin",
      decidedAt: "2026-06-21T09:00:00Z",
    },
    replacesId: "cr-default-1",
  },
  {
    id: "cr-default-1",
    scope: "DEFAULT",
    rateBps: 1800,
    effectiveFrom: "2026-01-01",
    effectiveTo: "2026-06-30",
    status: "RETIRED",
  },
  {
    id: "cr-cat-kurta",
    scope: "CATEGORY",
    categoryId: "kurta-set",
    categoryName: "Kurta set",
    rateBps: 1200,
    effectiveFrom: "2026-12-01",
    status: "DRAFT",
    approval: { status: "PENDING", requestedBy: FINANCE, requestedAt: "2026-11-09T12:00:00Z" },
  },
  {
    id: "cr-cat-makeup",
    scope: "CATEGORY",
    categoryId: "makeup",
    categoryName: "Makeup",
    rateBps: 1800,
    effectiveFrom: "2026-10-01",
    status: "APPROVED",
    approval: {
      status: "APPROVED",
      requestedBy: FINANCE,
      requestedAt: "2026-09-20T10:00:00Z",
      decidedBy: "Test Admin",
      decidedAt: "2026-09-22T10:00:00Z",
    },
  },
  {
    id: "cr-seller-maria",
    scope: "SELLER",
    sellerId: "maria-b",
    sellerName: "Maria B",
    rateBps: 1000,
    effectiveFrom: "2026-09-01",
    status: "APPROVED",
    approval: {
      status: "APPROVED",
      requestedBy: FINANCE,
      requestedAt: "2026-08-25T10:00:00Z",
      decidedBy: "Test Admin",
      decidedAt: "2026-08-26T10:00:00Z",
    },
  },
];

export const TAX_RULES_MOCK: TaxRule[] = [
  {
    id: "tr-sindh-company",
    province: "Sindh",
    sellerType: "COMPANY",
    taxType: "Sales tax",
    rateBps: 1300,
    effectiveFrom: "2027-01-01",
    status: "DRAFT",
  },
  {
    id: "tr-punjab-sole",
    province: "Punjab",
    sellerType: "SOLE_PROP",
    taxType: "Sales tax",
    rateBps: 1600,
    effectiveFrom: "2026-07-01",
    status: "PUBLISHED",
    approval: {
      status: "APPROVED",
      requestedBy: FINANCE,
      requestedAt: "2026-06-15T10:00:00Z",
      decidedBy: "Test Admin",
      decidedAt: "2026-06-16T10:00:00Z",
    },
  },
  {
    id: "tr-ict-company",
    province: "Islamabad (ICT)",
    sellerType: "COMPANY",
    taxType: "Withholding tax",
    rateBps: 200,
    effectiveFrom: "2026-12-01",
    status: "DRAFT",
    approval: { status: "PENDING", requestedBy: FINANCE, requestedAt: "2026-11-10T08:30:00Z" },
  },
];
