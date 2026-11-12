import type { StatusTone } from "@/components/ui/StatusBadge";
import { Category } from "@/features/categories/categories.types";
import { getCategoryPath } from "@/features/categories/categories.helpers";
import { Approval, CommissionRule, CommissionScope, SellerType, TaxRule } from "./tiers.types";

export const commissionScopeLabelMap: Record<CommissionScope, string> = {
  DEFAULT: "Default",
  CATEGORY: "Category tier",
  SELLER: "Seller tier",
};

/** Higher wins when more than one tier matches a suborder. */
export const SCOPE_PRIORITY: Record<CommissionScope, number> = {
  SELLER: 3,
  CATEGORY: 2,
  DEFAULT: 1,
};

export const sellerTypeLabelMap: Record<SellerType, string> = {
  SOLE_PROP: "Sole proprietor",
  AOP: "Partnership (AOP)",
  COMPANY: "Company",
};

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad (ICT)",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];

export const TAX_TYPE_SUGGESTIONS = ["Sales tax", "Withholding tax"];

export const formatRate = (bps: number) =>
  `${(bps / 100).toLocaleString("en-PK", { maximumFractionDigits: 2 })}%`;

/** "12.5" -> 1250; returns null for anything that isn't a valid 0–100 percentage. */
export function parseRate(value: string): number | null {
  const v = value.trim();
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n >= 0 && n <= 100 ? Math.round(n * 100) : null;
}

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Day before a YYYY-MM-DD date, for closing the rule a new version replaces. */
export const dayBefore = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

export const formatDay = (iso?: string | null) =>
  iso
    ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

type RuleLike = {
  status: string;
  effectiveFrom: string;
  approval?: Approval | null;
};

const LIVE = ["APPROVED", "PUBLISHED"];

export const isPendingApproval = (r: RuleLike) =>
  r.status === "DRAFT" && r.approval?.status === "PENDING";

/** Status shown in the tables. */
export function getRuleBadge(r: RuleLike): { label: string; tone: StatusTone } {
  if (r.status === "RETIRED") return { label: "Retired", tone: "neutral" };
  if (LIVE.includes(r.status)) {
    if (r.effectiveFrom > todayIso()) return { label: "Scheduled", tone: "info" };
    return { label: r.status === "PUBLISHED" ? "Published" : "Active", tone: "success" };
  }
  if (r.approval?.status === "PENDING") return { label: "Awaiting 2nd approver", tone: "warning" };
  if (r.approval?.status === "REJECTED") return { label: "Rejected", tone: "danger" };
  return { label: "Draft", tone: "neutral" };
}

export const isLive = (r: RuleLike) => LIVE.includes(r.status);

export function commissionTarget(r: Pick<CommissionRule, "scope" | "sellerName" | "categoryName">) {
  if (r.scope === "SELLER") return r.sellerName ?? "—";
  if (r.scope === "CATEGORY") return r.categoryName ?? "—";
  return "All sellers";
}

/** Rules that compete for the same slot: one live default, one per category, one per seller. */
export const sameCommissionTarget = (
  a: Pick<CommissionRule, "scope" | "sellerId" | "categoryId">,
  b: Pick<CommissionRule, "scope" | "sellerId" | "categoryId">,
) =>
  a.scope === b.scope &&
  (a.scope === "DEFAULT" ||
    (a.scope === "SELLER" && a.sellerId === b.sellerId) ||
    (a.scope === "CATEGORY" && a.categoryId === b.categoryId));

export const sameTaxTarget = (
  a: Pick<TaxRule, "province" | "sellerType" | "taxType">,
  b: Pick<TaxRule, "province" | "sellerType" | "taxType">,
) =>
  a.province === b.province &&
  a.sellerType === b.sellerType &&
  a.taxType.trim().toLowerCase() === b.taxType.trim().toLowerCase();

/**
 * The commission tier that applies to a suborder on `onDate`.
 * A category tier also covers that category's sub-categories; the deepest match wins.
 */
export function resolveCommission(
  rules: CommissionRule[],
  categories: Category[],
  sellerId: string | null,
  categoryId: string | null,
  onDate = todayIso(),
): CommissionRule | null {
  const live = rules.filter(
    (r) =>
      r.status === "APPROVED" &&
      r.effectiveFrom <= onDate &&
      (!r.effectiveTo || r.effectiveTo >= onDate),
  );
  if (sellerId) {
    const seller = live.find((r) => r.scope === "SELLER" && r.sellerId === sellerId);
    if (seller) return seller;
  }
  if (categoryId) {
    const path = getCategoryPath(categories, categoryId).map((c) => c.id).reverse();
    for (const id of path) {
      const cat = live.find((r) => r.scope === "CATEGORY" && r.categoryId === id);
      if (cat) return cat;
    }
  }
  return live.find((r) => r.scope === "DEFAULT") ?? null;
}

/** Live and in-progress rules first, newest effective date first; retired at the end. */
export function sortRules<T extends { status: string; effectiveFrom: string }>(list: T[]) {
  const rank = (r: T) => (r.status === "RETIRED" ? 1 : 0);
  return [...list].sort((a, b) => rank(a) - rank(b) || b.effectiveFrom.localeCompare(a.effectiveFrom));
}
