"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Category } from "@/features/categories/categories.types";
import { formatCategoryPath, getCategoryPath } from "@/features/categories/categories.helpers";
import { Seller } from "@/features/sellers/sellers.types";
import { CommissionRule, CommissionScope, SaveCommissionRuleDto } from "../tiers.types";
import { commissionScopeLabelMap, isLive, parseRate, todayIso } from "../tiers.helpers";

type Result = { success: boolean; message: string };

type CommissionRuleModalProps = {
  open: boolean;
  /** Undefined = new tier. */
  rule?: CommissionRule;
  sellers: Seller[];
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onSave: (
    dto: SaveCommissionRuleDto,
    meta: { sellerName?: string | null; categoryName?: string | null },
  ) => Promise<Result>;
};

const SCOPES: CommissionScope[] = ["DEFAULT", "CATEGORY", "SELLER"];

const SCOPE_HINT: Record<CommissionScope, string> = {
  DEFAULT: "Applies to every suborder that has no seller or category tier.",
  CATEGORY: "Applies to this category and all its sub-categories, unless the seller has its own tier.",
  SELLER: "Applies to every suborder from this seller. Highest priority.",
};

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

export function CommissionRuleModal({
  open,
  rule,
  sellers,
  categories,
  saving,
  onClose,
  onSave,
}: CommissionRuleModalProps) {
  const [scope, setScope] = useState<CommissionScope>("CATEGORY");
  const [sellerId, setSellerId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Editing a live tier makes a new version for the same slot, so the slot is fixed.
  const newVersion = !!rule && isLive(rule);
  const lockedTarget = !!rule;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setScope(rule?.scope ?? "CATEGORY");
    setSellerId(rule?.sellerId ?? "");
    setCategoryId(rule?.categoryId ?? "");
    setRate(rule ? String(rule.rateBps / 100) : "");
    setEffectiveFrom(
      rule && !newVersion && rule.effectiveFrom >= todayIso() ? rule.effectiveFrom : todayIso(),
    );
  }, [open, rule, newVersion]);

  const sellerOptions = useMemo(
    () =>
      sellers
        .filter((s) => s.status === "APPROVED" || s.id === sellerId)
        .map((s) => ({ value: s.id, label: s.name })),
    [sellers, sellerId],
  );

  const categoryOptions = useMemo(
    () =>
      categories
        .map((c) => ({ value: c.id, label: formatCategoryPath(getCategoryPath(categories, c.id)) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categories],
  );

  const submit = async (send: boolean) => {
    const next: Record<string, string> = {};
    const rateBps = parseRate(rate);
    if (rateBps === null) next.rate = "Enter a rate from 0 to 100, up to 2 decimals";
    if (scope === "SELLER" && !sellerId) next.target = "Choose a seller";
    if (scope === "CATEGORY" && !categoryId) next.target = "Choose a category";
    if (!effectiveFrom) next.effectiveFrom = "Choose a date";
    else if (effectiveFrom < todayIso()) next.effectiveFrom = "Can't be in the past";
    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await onSave(
      {
        scope,
        sellerId: scope === "SELLER" ? sellerId : null,
        categoryId: scope === "CATEGORY" ? categoryId : null,
        rateBps: rateBps!,
        effectiveFrom,
        submit: send,
      },
      {
        sellerName: sellers.find((s) => s.id === sellerId)?.name ?? null,
        categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      },
    );
    if (res.success) onClose();
    else setErrors({ form: res.message });
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(true);
        }}
        className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg"
      >
        <div>
          <h2 className="text-lg font-semibold">
            {!rule ? "New commission tier" : newVersion ? "Change commission tier" : "Edit draft tier"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {newVersion
              ? "This creates a new version. The current rate keeps applying until the change is approved and its date arrives."
              : "Commission is taken per suborder. A second admin has to approve before it applies."}
          </p>
        </div>

        <div>
          <span className={labelClass}>Tier type</span>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tier type">
            {SCOPES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={scope === s}
                disabled={lockedTarget && scope !== s}
                onClick={() => setScope(s)}
                className={cn(
                  "min-h-11 cursor-pointer rounded-[10px] border px-3.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40",
                  scope === s ? "border-foreground bg-foreground text-white" : "border-input bg-white hover:bg-muted",
                )}
              >
                {commissionScopeLabelMap[s]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{SCOPE_HINT[scope]}</p>
        </div>

        {scope !== "DEFAULT" && (
          <div>
            {scope === "SELLER" ? (
              <FilterSelect
                label="Seller"
                value={sellerId}
                options={sellerOptions}
                placeholder="Choose an approved seller"
                disabled={lockedTarget}
                onChange={setSellerId}
              />
            ) : (
              <FilterSelect
                label="Category"
                value={categoryId}
                options={categoryOptions}
                placeholder="Choose a category"
                disabled={lockedTarget}
                onChange={setCategoryId}
              />
            )}
            {errors.target && <p className="mt-1 text-xs text-destructive">{errors.target}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cr-rate" className={labelClass}>Commission rate</Label>
            <div className="relative">
              <Input
                id="cr-rate"
                inputMode="decimal"
                className="h-11 rounded-[10px] bg-white pr-8"
                placeholder="12.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                aria-invalid={!!errors.rate}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            {errors.rate && <p className="mt-1 text-xs text-destructive">{errors.rate}</p>}
          </div>
          <div>
            <Label htmlFor="cr-from" className={labelClass}>Effective from</Label>
            <Input
              id="cr-from"
              type="date"
              min={todayIso()}
              className="h-11 rounded-[10px] bg-white"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              aria-invalid={!!errors.effectiveFrom}
            />
            {errors.effectiveFrom && <p className="mt-1 text-xs text-destructive">{errors.effectiveFrom}</p>}
          </div>
        </div>

        {errors.form && (
          <p className="rounded-[10px] bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 pt-1 sm:flex-row">
          <Button type="button" variant="ghost" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={() => submit(false)}
          >
            Save draft
          </Button>
          <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
            Submit for approval
          </Button>
        </div>
      </form>
    </Modal>
  );
}
