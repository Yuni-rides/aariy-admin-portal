"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
};

const baseBtn =
  "h-9 min-w-9 cursor-pointer rounded-[10px] border px-2 text-sm font-medium";
const activeBtn = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";
const inactiveBtn = "border-input bg-white text-foreground hover:bg-accent";

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const pages: (number | "...")[] = [];
    const range = 2;

    const start = Math.max(1, page - range);
    const end = Math.min(totalPages, page + range);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-[13px] text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          aria-label="Previous page"
          className={cn(baseBtn, inactiveBtn)}
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-1.5 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(baseBtn, p === page ? activeBtn : inactiveBtn)}
              onClick={() => p !== page && onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="ghost"
          aria-label="Next page"
          className={cn(baseBtn, inactiveBtn)}
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
