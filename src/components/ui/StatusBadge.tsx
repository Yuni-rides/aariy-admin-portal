import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-[#E3F3E8] text-[#1D6B3A]",
  warning: "bg-[#FFF1D6] text-[#8A5A00]",
  danger: "bg-[#FDE5E5] text-[#A12A2A]",
  info: "bg-[#E3EEFB] text-[#1F5A99]",
  neutral: "bg-muted text-muted-foreground",
};

type StatusBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
};

export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
