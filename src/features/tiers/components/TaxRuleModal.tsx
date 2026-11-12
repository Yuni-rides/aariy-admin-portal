"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { SaveTaxRuleDto, SellerType, TaxRule } from "../tiers.types";
import {
  PROVINCES,
  TAX_TYPE_SUGGESTIONS,
  isLive,
  parseRate,
  sellerTypeLabelMap,
  todayIso,
} from "../tiers.helpers";

type Result = { success: boolean; message: string };

type TaxRuleModalProps = {
  open: boolean;
  rule?: TaxRule;
  saving: boolean;
  onClose: () => void;
  onSave: (dto: SaveTaxRuleDto) => Promise<Result>;
};

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

const SELLER_TYPE_OPTIONS = (Object.keys(sellerTypeLabelMap) as SellerType[]).map((value) => ({
  value,
  label: sellerTypeLabelMap[value],
}));

export function TaxRuleModal({ open, rule, saving, onClose, onSave }: TaxRuleModalProps) {
  const [province, setProvince] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("COMPANY");
  const [taxType, setTaxType] = useState("");
  const [rate, setRate] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const newVersion = !!rule && isLive(rule);
  const locked = !!rule;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setProvince(rule?.province ?? "");
    setSellerType(rule?.sellerType ?? "COMPANY");
    setTaxType(rule?.taxType ?? "");
    setRate(rule ? String(rule.rateBps / 100) : "");
    setEffectiveFrom(
      rule && !newVersion && rule.effectiveFrom >= todayIso() ? rule.effectiveFrom : todayIso(),
    );
  }, [open, rule, newVersion]);

  const submit = async (send: boolean) => {
    const next: Record<string, string> = {};
    const rateBps = parseRate(rate);
    if (!province) next.province = "Choose a province";
    if (!taxType.trim()) next.taxType = "Enter the tax, e.g. Sales tax";
    if (rateBps === null) next.rate = "Enter a rate from 0 to 100, up to 2 decimals";
    if (!effectiveFrom) next.effectiveFrom = "Choose a date";
    else if (effectiveFrom < todayIso()) next.effectiveFrom = "Can't be in the past";
    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await onSave({
      province,
      sellerType,
      taxType: taxType.trim(),
      rateBps: rateBps!,
      effectiveFrom,
      submit: send,
    });
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
            {!rule ? "New tax rule" : newVersion ? "Change tax rule" : "Edit draft tax rule"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the rate from the tax adviser&apos;s opinion. A second admin has to approve before it is published.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FilterSelect
              label="Province"
              value={province}
              options={PROVINCES.map((p) => ({ value: p, label: p }))}
              placeholder="Choose a province"
              disabled={locked}
              onChange={setProvince}
            />
            {errors.province && <p className="mt-1 text-xs text-destructive">{errors.province}</p>}
          </div>
          <FilterSelect
            label="Seller type"
            value={sellerType}
            options={SELLER_TYPE_OPTIONS}
            disabled={locked}
            onChange={(v) => setSellerType(v as SellerType)}
          />
        </div>

        <div>
          <Label htmlFor="tr-tax" className={labelClass}>Tax</Label>
          <Input
            id="tr-tax"
            list="tax-type-suggestions"
            className="h-11 rounded-[10px] bg-white"
            placeholder="Sales tax"
            value={taxType}
            disabled={locked}
            onChange={(e) => setTaxType(e.target.value)}
          />
          <datalist id="tax-type-suggestions">
            {TAX_TYPE_SUGGESTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          {errors.taxType && <p className="mt-1 text-xs text-destructive">{errors.taxType}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tr-rate" className={labelClass}>Rate</Label>
            <div className="relative">
              <Input
                id="tr-rate"
                inputMode="decimal"
                className="h-11 rounded-[10px] bg-white pr-8"
                placeholder="16"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            {errors.rate && <p className="mt-1 text-xs text-destructive">{errors.rate}</p>}
          </div>
          <div>
            <Label htmlFor="tr-from" className={labelClass}>Effective from</Label>
            <Input
              id="tr-from"
              type="date"
              min={todayIso()}
              className="h-11 rounded-[10px] bg-white"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
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
