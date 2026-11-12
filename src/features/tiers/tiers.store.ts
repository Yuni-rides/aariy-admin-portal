import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import {
  Approval,
  CommissionRule,
  SaveCommissionRuleDto,
  SaveTaxRuleDto,
  TaxRule,
} from "./tiers.types";
import { COMMISSION_RULES_MOCK, TAX_RULES_MOCK } from "./tiers.mock";
import {
  dayBefore,
  isLive,
  isPendingApproval,
  sameCommissionTarget,
  sameTaxTarget,
  todayIso,
} from "./tiers.helpers";

type Result = { success: boolean; message: string };

/** Names are denormalised on the rule, as the API will return them. */
type CommissionMeta = { sellerName?: string | null; categoryName?: string | null };

type TiersStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  commissionRules: CommissionRule[];
  taxRules: TaxRule[];

  fetchTiers: () => Promise<void>;
  /** `id` of a draft edits it in place; `id` of a live rule creates a new version that replaces it. */
  saveCommissionRule: (dto: SaveCommissionRuleDto, meta: CommissionMeta, id?: string) => Promise<Result>;
  approveCommissionRule: (id: string) => Promise<Result>;
  rejectCommissionRule: (id: string, reason: string) => Promise<Result>;
  saveTaxRule: (dto: SaveTaxRuleDto, id?: string) => Promise<Result>;
  approveTaxRule: (id: string) => Promise<Result>;
  rejectTaxRule: (id: string, reason: string) => Promise<Result>;
};

export const currentAdminName = () => {
  const user = useAuthStore.getState().user;
  return [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Super admin";
};

const now = () => new Date().toISOString();

/**
 * End a live rule the day before its replacement starts. It keeps applying until
 * then, so it is only marked retired once that day has passed.
 */
function closeRule<T extends { status: string; effectiveTo?: string | null }>(rule: T, nextStart: string): T {
  const effectiveTo = dayBefore(nextStart);
  return { ...rule, effectiveTo, status: effectiveTo < todayIso() ? "RETIRED" : rule.status };
}

const pendingApproval = (): Approval => ({
  status: "PENDING",
  requestedBy: currentAdminName(),
  requestedAt: now(),
});

/** Shared rule checks before saving a change. */
function checkChange(
  effectiveFrom: string,
  rateBps: number,
  existingPending: boolean,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) return "Choose an effective date";
  // Changes only apply to new orders, so they can't start in the past.
  if (effectiveFrom < todayIso()) return "The effective date can't be in the past";
  if (rateBps < 0 || rateBps > 10000) return "Rate must be between 0% and 100%";
  if (existingPending) return "A change for this tier is already waiting for approval";
  return null;
}

export const useTiersStore = create<TiersStore>((set, get) => {
  const commissions = () =>
    get().commissionRules.length ? get().commissionRules : COMMISSION_RULES_MOCK;
  const taxes = () => (get().taxRules.length ? get().taxRules : TAX_RULES_MOCK);

  /** Approver must not be the requester (maker-checker). */
  const approverError = (rule?: { approval?: Approval | null; status: string; effectiveFrom: string }) => {
    if (!rule || !isPendingApproval(rule)) return "This change isn't waiting for approval";
    if (rule.approval!.requestedBy === currentAdminName())
      return "You requested this change; another admin has to approve it";
    return null;
  };

  return {
    loading: false,
    saving: false,
    error: null,
    commissionRules: [],
    taxRules: [],

    fetchTiers: async () => {
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await tiersApi.getTiers();
        set({ commissionRules: commissions(), taxRules: taxes(), loading: false });
      } catch (e: any) {
        set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
      }
    },

    saveCommissionRule: async (dto, meta, id) => {
      const list = commissions();
      const existing = id ? list.find((r) => r.id === id) : undefined;
      if (dto.scope === "SELLER" && !dto.sellerId) return { success: false, message: "Choose a seller" };
      if (dto.scope === "CATEGORY" && !dto.categoryId) return { success: false, message: "Choose a category" };

      const target = { scope: dto.scope, sellerId: dto.sellerId ?? null, categoryId: dto.categoryId ?? null };
      const otherPending = list.some(
        (r) => r.id !== id && isPendingApproval(r) && sameCommissionTarget(r, target),
      );
      const error = checkChange(dto.effectiveFrom, dto.rateBps, dto.submit && otherPending);
      if (error) return { success: false, message: error };

      set({ saving: true });
      // TODO(api): await tiersApi.saveCommissionRule(id, dto);
      const fields = {
        ...target,
        sellerName: dto.scope === "SELLER" ? meta.sellerName ?? null : null,
        categoryName: dto.scope === "CATEGORY" ? meta.categoryName ?? null : null,
        rateBps: dto.rateBps,
        effectiveFrom: dto.effectiveFrom,
        status: "DRAFT" as const,
        approval: dto.submit ? pendingApproval() : null,
      };

      let next: CommissionRule[];
      if (existing && existing.status === "DRAFT") {
        next = list.map((r) => (r.id === id ? { ...r, ...fields } : r));
      } else {
        // New tier, or a new version of a live one (the live rule keeps applying until approval).
        const live = existing ?? list.find((r) => isLive(r) && sameCommissionTarget(r, target));
        next = [{ id: `cr-${Date.now()}`, ...fields, replacesId: live?.id ?? null }, ...list];
      }
      set({ commissionRules: next, saving: false });
      return {
        success: true,
        message: dto.submit ? "Sent to a second approver" : "Saved as draft",
      };
    },

    approveCommissionRule: async (id) => {
      const list = commissions();
      const rule = list.find((r) => r.id === id);
      const error = approverError(rule);
      if (error) return { success: false, message: error };

      set({ saving: true });
      // TODO(api): await tiersApi.decideApproval(rule.approvalId, "APPROVED");
      const decided: CommissionRule = {
        ...rule!,
        status: "APPROVED",
        approval: { ...rule!.approval!, status: "APPROVED", decidedBy: currentAdminName(), decidedAt: now() },
      };
      // Close every other live rule for the same slot the day before this one starts.
      const next = list.map((r) =>
        r.id === id
          ? decided
          : r.status === "APPROVED" && sameCommissionTarget(r, decided)
            ? closeRule(r, decided.effectiveFrom)
            : r,
      );
      set({ commissionRules: next, saving: false });
      return { success: true, message: "Approved. It applies to new orders from the effective date." };
    },

    rejectCommissionRule: async (id, reason) => {
      if (!reason.trim()) return { success: false, message: "Add a reason for rejecting" };
      const list = commissions();
      const rule = list.find((r) => r.id === id);
      if (!rule || !isPendingApproval(rule)) return { success: false, message: "This change isn't waiting for approval" };
      set({ saving: true });
      // TODO(api): await tiersApi.decideApproval(rule.approvalId, "REJECTED", reason);
      set({
        commissionRules: list.map((r) =>
          r.id === id
            ? {
                ...r,
                approval: { ...r.approval!, status: "REJECTED", decidedBy: currentAdminName(), decidedAt: now(), reason: reason.trim() },
              }
            : r,
        ),
        saving: false,
      });
      return { success: true, message: "Change rejected" };
    },

    saveTaxRule: async (dto, id) => {
      const list = taxes();
      const existing = id ? list.find((r) => r.id === id) : undefined;
      if (!dto.province) return { success: false, message: "Choose a province" };
      if (!dto.taxType.trim()) return { success: false, message: "Enter the tax" };
      const target = { province: dto.province, sellerType: dto.sellerType, taxType: dto.taxType.trim() };
      const otherPending = list.some((r) => r.id !== id && isPendingApproval(r) && sameTaxTarget(r, target));
      const error = checkChange(dto.effectiveFrom, dto.rateBps, dto.submit && otherPending);
      if (error) return { success: false, message: error };

      set({ saving: true });
      // TODO(api): await tiersApi.saveTaxRule(id, dto);
      const fields = {
        ...target,
        rateBps: dto.rateBps,
        effectiveFrom: dto.effectiveFrom,
        status: "DRAFT" as const,
        approval: dto.submit ? pendingApproval() : null,
      };
      let next: TaxRule[];
      if (existing && existing.status === "DRAFT") {
        next = list.map((r) => (r.id === id ? { ...r, ...fields } : r));
      } else {
        const live = existing ?? list.find((r) => isLive(r) && sameTaxTarget(r, target));
        next = [{ id: `tr-${Date.now()}`, ...fields, replacesId: live?.id ?? null }, ...list];
      }
      set({ taxRules: next, saving: false });
      return { success: true, message: dto.submit ? "Sent to a second approver" : "Saved as draft" };
    },

    approveTaxRule: async (id) => {
      const list = taxes();
      const rule = list.find((r) => r.id === id);
      const error = approverError(rule);
      if (error) return { success: false, message: error };

      set({ saving: true });
      // TODO(api): await tiersApi.decideApproval(rule.approvalId, "APPROVED");
      const decided: TaxRule = {
        ...rule!,
        status: "PUBLISHED",
        approval: { ...rule!.approval!, status: "APPROVED", decidedBy: currentAdminName(), decidedAt: now() },
      };
      const next = list.map((r) =>
        r.id === id
          ? decided
          : r.status === "PUBLISHED" && sameTaxTarget(r, decided)
            ? closeRule(r, decided.effectiveFrom)
            : r,
      );
      set({ taxRules: next, saving: false });
      return { success: true, message: "Tax rule published for new orders from the effective date" };
    },

    rejectTaxRule: async (id, reason) => {
      if (!reason.trim()) return { success: false, message: "Add a reason for rejecting" };
      const list = taxes();
      const rule = list.find((r) => r.id === id);
      if (!rule || !isPendingApproval(rule)) return { success: false, message: "This change isn't waiting for approval" };
      set({ saving: true });
      // TODO(api): await tiersApi.decideApproval(rule.approvalId, "REJECTED", reason);
      set({
        taxRules: list.map((r) =>
          r.id === id
            ? {
                ...r,
                approval: { ...r.approval!, status: "REJECTED", decidedBy: currentAdminName(), decidedAt: now(), reason: reason.trim() },
              }
            : r,
        ),
        saving: false,
      });
      return { success: true, message: "Change rejected" };
    },
  };
});
