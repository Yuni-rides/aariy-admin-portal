"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { EditStamp, Policies } from "../settings.types";
import { formatStamp, validatePolicies } from "../settings.helpers";

type Result = { success: boolean; message: string };

type PoliciesFormProps = {
  policies: Policies;
  stamp?: EditStamp;
  saving: boolean;
  onSave: (policies: Policies) => Promise<Result>;
};

type FormState = { returnWindowDays: string; confirmationTimeoutHours: string };

const toForm = (p: Policies): FormState => ({
  returnWindowDays: String(p.returnWindowDays),
  confirmationTimeoutHours: String(p.confirmationTimeoutHours),
});

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

export function PoliciesForm({ policies, stamp, saving, onSave }: PoliciesFormProps) {
  const [form, setForm] = useState<FormState>(toForm(policies));
  const [errors, setErrors] = useState<Partial<Record<keyof Policies, string>>>({});

  useEffect(() => setForm(toForm(policies)), [policies]);

  const dirty =
    form.returnWindowDays !== String(policies.returnWindowDays) ||
    form.confirmationTimeoutHours !== String(policies.confirmationTimeoutHours);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validatePolicies(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSave({
      returnWindowDays: Number(form.returnWindowDays),
      confirmationTimeoutHours: Number(form.confirmationTimeoutHours),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2 rounded-2xl p-[18px] shadow-none">
          <h2 className="text-[15px] font-semibold">Return window</h2>
          <div className="max-w-[220px]">
            <Label htmlFor="pol-return" className={labelClass}>Days after delivery</Label>
            <Input
              id="pol-return"
              inputMode="numeric"
              className="h-11 rounded-[10px] bg-white"
              value={form.returnWindowDays}
              aria-invalid={!!errors.returnWindowDays}
              onChange={(e) => setForm((f) => ({ ...f, returnWindowDays: e.target.value }))}
            />
            {errors.returnWindowDays && <p className="mt-1 text-xs text-destructive">{errors.returnWindowDays}</p>}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Applies to future deliveries only. 0 means no returns.
          </p>
        </Card>

        <Card className="flex flex-col gap-2 rounded-2xl p-[18px] shadow-none">
          <h2 className="text-[15px] font-semibold">Order confirmation timeout</h2>
          <div className="max-w-[220px]">
            <Label htmlFor="pol-timeout" className={labelClass}>Hours to confirm a COD order</Label>
            <Input
              id="pol-timeout"
              inputMode="numeric"
              className="h-11 rounded-[10px] bg-white"
              value={form.confirmationTimeoutHours}
              aria-invalid={!!errors.confirmationTimeoutHours}
              onChange={(e) => setForm((f) => ({ ...f, confirmationTimeoutHours: e.target.value }))}
            />
            {errors.confirmationTimeoutHours && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmationTimeoutHours}</p>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            Stock is held while the CSR calls. If the order isn&apos;t confirmed in time it is
            cancelled and the stock released.
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          Last edited by {stamp?.updatedBy ?? "—"}, {formatStamp(stamp?.updatedAt)}. Every change is logged.
        </p>
        <Button type="submit" disabled={saving || !dirty} className="min-h-11 cursor-pointer rounded-[10px]">
          {saving ? "Saving..." : "Save policies"}
        </Button>
      </div>
    </form>
  );
}
