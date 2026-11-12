"use client";

import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";

type FilterSelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/** Labelled select used in list-page filter bars. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  className,
  disabled,
}: FilterSelectProps) {
  return (
    <div className={cn("min-w-[180px] flex-1", className)}>
      <Label className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-11 cursor-pointer rounded-[10px] bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
