"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Exact tokens from the "Admin Add Product" design, so this page matches it 1:1.
 * (Card #EADFD8 border, 12px radius, 24px padding; inputs 44px, 8px radius, #DCCFC6 border.)
 */
export const ds = {
  card: "flex flex-col gap-[18px] rounded-xl border border-[#EADFD8] bg-white p-6",
  h2: "m-0 flex flex-wrap items-center gap-2.5 text-base font-semibold text-[#1F1A17]",
  sub: "m-0 text-[13px] leading-normal text-[#6B5E57]",
  label: "flex flex-wrap items-baseline gap-2 text-[13px] font-medium text-[#3A302B]",
  hint: "m-0 text-xs leading-[1.45] text-[#6B5E57]",
  input:
    "h-11 w-full rounded-lg border border-[#DCCFC6] bg-white px-3 text-sm text-[#1F1A17] shadow-none placeholder:text-[#8A7B73] focus-visible:ring-2 focus-visible:ring-[#A9461F]/30",
  cellInput:
    "h-10 w-full rounded-lg border border-[#DCCFC6] bg-white px-3 text-sm text-[#1F1A17] shadow-none placeholder:text-[#8A7B73] focus-visible:ring-2 focus-visible:ring-[#A9461F]/30",
  textarea:
    "min-h-24 w-full resize-y rounded-lg border border-[#DCCFC6] bg-white px-3 py-2.5 text-sm text-[#1F1A17] shadow-none placeholder:text-[#8A7B73] focus-visible:ring-2 focus-visible:ring-[#A9461F]/30",
  readOnly:
    "flex h-11 items-center gap-2.5 overflow-hidden rounded-lg border border-[#EADFD8] bg-[#F7F1ED] px-3 text-sm text-[#3A302B]",
  btn: "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-[18px] text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
  ghost: "border border-[#DCCFC6] bg-white text-[#3A302B] hover:bg-[#FAF6F3]",
  primary: "border border-[#A9461F] bg-[#A9461F] text-white hover:bg-[#8A3716]",
  soft: "h-10 border border-[#F1D5C7] bg-[#FBEDE6] text-[#8A3716] hover:bg-[#F7E0D4]",
  req: "text-[#B3261E]",
  error: "m-0 text-xs text-[#B3261E]",
};

/** White section card used across the product form. */
export function FormCard({
  title,
  description,
  badge,
  action,
  className,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={id} className={cn(ds.card, className)}>
      {description || action ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id={id} className={ds.h2}>
              {title}
              {badge}
            </h2>
            {description && <p className={ds.sub}>{description}</p>}
          </div>
          {action}
        </div>
      ) : (
        <h2 id={id} className={ds.h2}>
          {title}
          {badge}
        </h2>
      )}
      {children}
    </section>
  );
}

/** Field label with optional required star. `extra` sits at the far right (e.g. a counter). */
export function FieldLabel({
  htmlFor,
  required,
  children,
  extra,
  id,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  extra?: ReactNode;
  id?: string;
}) {
  const content = (
    <>
      <span>
        {children}
        {required && (
          <span className={ds.req} aria-hidden="true">
            {" "}*
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </span>
      {extra && <span className="ml-auto">{extra}</span>}
    </>
  );
  return htmlFor ? (
    <label htmlFor={htmlFor} id={id} className={ds.label}>
      {content}
    </label>
  ) : (
    <span id={id} className={ds.label}>
      {content}
    </span>
  );
}

export function FieldHint({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className={ds.hint}>
      {children}
    </p>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className={ds.error}>{children}</p>;
}

/** Pill button used for Yes/No and multi-select options. */
export function Chip({
  on,
  children,
  onClick,
  role,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
  role?: "radio";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === "radio" ? on : undefined}
      aria-pressed={role ? undefined : on}
      onClick={onClick}
      className={cn(
        "inline-flex h-[34px] cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px]",
        on
          ? "border-[#E2B8A3] bg-[#FBEDE6] font-semibold text-[#7E3216]"
          : "border-[#DCCFC6] bg-white text-[#3A302B] hover:bg-[#FAF6F3]",
      )}
    >
      {children}
    </button>
  );
}

export const inputClass = ds.input;
/** Radix select trigger styled like the design's native select. */
export const selectClass = cn(ds.input, "cursor-pointer");
export const cellSelectClass = cn(ds.cellInput, "cursor-pointer");
