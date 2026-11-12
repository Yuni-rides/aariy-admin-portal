"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/TextArea";
import { EditStamp, StoreInfo } from "../settings.types";
import { formatStamp, validateStoreInfo } from "../settings.helpers";

type Result = { success: boolean; message: string };

type StoreInfoFormProps = {
  storeInfo: StoreInfo;
  stamp?: EditStamp;
  saving: boolean;
  onSave: (info: StoreInfo) => Promise<Result>;
};

const FIELDS: { key: keyof StoreInfo; label: string; type?: string; placeholder?: string; hint?: string }[] = [
  { key: "storeName", label: "Store name" },
  { key: "supportEmail", label: "Support email", type: "email", hint: "Shown on the Contact page and in order emails." },
  { key: "supportPhone", label: "Support phone", placeholder: "+92 300 1234567" },
  { key: "whatsapp", label: "WhatsApp (optional)", placeholder: "+92 300 1234567" },
  { key: "instagramUrl", label: "Instagram link (optional)", placeholder: "https://instagram.com/…" },
  { key: "facebookUrl", label: "Facebook link (optional)", placeholder: "https://facebook.com/…" },
];

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

export function StoreInfoForm({ storeInfo, stamp, saving, onSave }: StoreInfoFormProps) {
  const [form, setForm] = useState<StoreInfo>(storeInfo);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreInfo, string>>>({});

  useEffect(() => setForm(storeInfo), [storeInfo]);

  const dirty = (Object.keys(form) as (keyof StoreInfo)[]).some((k) => form[k] !== storeInfo[k]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    ) as StoreInfo;
    const next = validateStoreInfo(trimmed);
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSave(trimmed);
  };

  return (
    <Card className="rounded-2xl p-[18px] shadow-none">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">Store info</h2>
          <p className="text-[13px] text-muted-foreground">Shown in the storefront footer, Contact page and emails.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(({ key, label, type, placeholder, hint }) => (
            <div key={key}>
              <Label htmlFor={`si-${key}`} className={labelClass}>{label}</Label>
              <Input
                id={`si-${key}`}
                type={type ?? "text"}
                placeholder={placeholder}
                className="h-11 rounded-[10px] bg-white"
                value={form[key]}
                aria-invalid={!!errors[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
              {errors[key] ? (
                <p className="mt-1 text-xs text-destructive">{errors[key]}</p>
              ) : (
                hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
              )}
            </div>
          ))}
        </div>
        <div>
          <Label htmlFor="si-address" className={labelClass}>Business address</Label>
          <Textarea
            id="si-address"
            rows={2}
            className="rounded-[10px] bg-white"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">
            Last edited by {stamp?.updatedBy ?? "—"}, {formatStamp(stamp?.updatedAt)}. Every change is logged.
          </p>
          <Button type="submit" disabled={saving || !dirty} className="min-h-11 cursor-pointer rounded-[10px]">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
