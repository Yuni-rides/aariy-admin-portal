"use client";

import { ReactNode, useState } from "react";
import { Eye } from "lucide-react";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { cn } from "@/lib/utils";
import { maskValue, SensitiveKind } from "@/lib/mask";
import { useAuditStore } from "@/features/audit/audit.store";

type SensitiveValueProps = {
  value?: string | null;
  kind: SensitiveKind;
  /** What is being revealed, for the dialog and audit log, e.g. "buyer phone". */
  label: string;
  /** The record it belongs to, e.g. "Order ARY-1042". */
  target: string;
  /** Optional custom rendering of the full value once revealed (e.g. a tel: link). */
  renderRevealed?: (value: string) => ReactNode;
  className?: string;
};

/**
 * Shows a masked value with a Reveal button. Revealing asks for a reason and is
 * written to the audit log; the full value stays visible until the page is left.
 */
export function SensitiveValue({ value, kind, label, target, renderRevealed, className }: SensitiveValueProps) {
  const [revealed, setRevealed] = useState(false);
  const [asking, setAsking] = useState(false);
  const log = useAuditStore((s) => s.log);

  if (!value) return <span className={className}>—</span>;

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {revealed ? (
        (renderRevealed?.(value) ?? <span className="truncate">{value}</span>)
      ) : (
        <>
          <span className="truncate tabular-nums" aria-label={`${label} hidden`}>
            {maskValue(value, kind)}
          </span>
          <button
            type="button"
            title={`Reveal ${label}`}
            aria-label={`Reveal ${label}`}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1 text-xs text-primary hover:bg-accent"
            onClick={(e) => {
              e.stopPropagation();
              setAsking(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" /> Reveal
          </button>
        </>
      )}
      <ReasonDialog
        open={asking}
        title={`Reveal ${label}?`}
        description={`${target}. Your name and reason are saved in the audit log.`}
        confirmLabel="Reveal"
        requiredMessage="Say why you need to see it"
        onClose={() => setAsking(false)}
        onConfirm={async (reason) => {
          // TODO(api): fetch the full value from the reveal endpoint, which records the reason.
          log({ category: "DATA_ACCESS", action: `Revealed ${label}`, target, reason });
          setRevealed(true);
          return true;
        }}
      />
    </span>
  );
}
