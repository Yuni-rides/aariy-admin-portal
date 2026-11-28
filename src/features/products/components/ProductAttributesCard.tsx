"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import type { CategoryField } from "@/features/categories/categories.types";
import type { AttributeValue } from "../products.types";
import { Chip, FieldError, FieldLabel, FormCard, ds, selectClass } from "./ProductFormParts";

type ProductAttributesCardProps = {
  /** Non-variant fields of the chosen category, in display order. */
  fields: CategoryField[];
  values: Record<string, AttributeValue>;
  errors: Record<string, string>;
  loading: boolean;
  onChange: (code: string, value: AttributeValue | undefined) => void;
};

const fieldLabel = (f: CategoryField) => (f.unit ? `${f.name} (${f.unit})` : f.name);

/** "Product details": one input per category field. Inputs change when the category changes. */
export function ProductAttributesCard({ fields, values, errors, loading, onChange }: ProductAttributesCardProps) {
  const singles = fields.filter((f) => f.type !== "MULTI_SELECT");
  const multis = fields.filter((f) => f.type === "MULTI_SELECT");

  return (
    <FormCard
      id="h-attr"
      title="Product details"
      description="These come from the chosen category, so they change when the category changes."
    >
      {loading ? (
        <p className={ds.sub}>Loading this category&apos;s fields…</p>
      ) : (
        <>
          {singles.length > 0 && (
            <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              {singles.map((f) => {
                const id = `attr-${f.code}`;
                const value = values[f.code];
                return (
                  <div key={f.id} className="flex min-w-0 flex-col gap-1.5">
                    <FieldLabel htmlFor={f.type === "BOOLEAN" ? undefined : id} required={f.isRequired}>
                      {fieldLabel(f)}
                    </FieldLabel>
                    {f.type === "DROPDOWN" ? (
                      <Select value={typeof value === "string" ? value : ""} onValueChange={(v) => onChange(f.code, v)}>
                        <SelectTrigger id={id} className={selectClass} aria-invalid={!!errors[f.code]}>
                          <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : f.type === "BOOLEAN" ? (
                      <div role="radiogroup" aria-label={f.name} className="flex gap-2">
                        <Chip role="radio" on={value === true} onClick={() => onChange(f.code, true)}>
                          Yes
                        </Chip>
                        <Chip role="radio" on={value === false} onClick={() => onChange(f.code, false)}>
                          No
                        </Chip>
                      </div>
                    ) : (
                      <input
                        id={id}
                        type={f.type === "NUMBER" ? "number" : "text"}
                        inputMode={f.type === "NUMBER" ? "decimal" : undefined}
                        className={ds.input}
                        value={value === undefined ? "" : String(value)}
                        aria-invalid={!!errors[f.code]}
                        onChange={(e) => {
                          const v = e.target.value;
                          onChange(f.code, v === "" ? undefined : f.type === "NUMBER" ? Number(v) : v);
                        }}
                      />
                    )}
                    <FieldError>{errors[f.code]}</FieldError>
                  </div>
                );
              })}
            </div>
          )}

          {multis.map((f) => {
            const selected = Array.isArray(values[f.code]) ? (values[f.code] as string[]) : [];
            return (
              <div key={f.id} className="flex flex-col gap-1.5">
                <FieldLabel required={f.isRequired}>{fieldLabel(f)} (choose any)</FieldLabel>
                <div className="flex flex-wrap gap-2" role="group" aria-label={f.name}>
                  {(f.options ?? []).map((o) => {
                    const on = selected.includes(o);
                    return (
                      <Chip
                        key={o}
                        on={on}
                        onClick={() => {
                          const next = on ? selected.filter((x) => x !== o) : [...selected, o];
                          onChange(f.code, next.length ? next : undefined);
                        }}
                      >
                        {o}
                      </Chip>
                    );
                  })}
                </div>
                <FieldError>{errors[f.code]}</FieldError>
              </div>
            );
          })}
        </>
      )}
    </FormCard>
  );
}
