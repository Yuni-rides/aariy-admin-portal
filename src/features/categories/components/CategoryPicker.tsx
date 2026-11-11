"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category } from "../categories.types";
import {
  formatCategoryPath,
  getCategoryPath,
  getLeafCategories,
  getSiblings,
  hasChildren,
} from "../categories.helpers";

type CategoryPickerProps = {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  id?: string;
};

type SearchResult = { id: string; name: string; path: string };

/** Bold the part of `text` that matches `query`. */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-primary">
        {text.slice(i, i + query.length)}
      </mark>
      {text.slice(i + query.length)}
    </>
  );
}

/**
 * Cascading category picker: top-level categories in the first column, and
 * each opened category shows its children in the next column. Only last-level
 * categories can be picked, because products only go there. Typing searches
 * all last-level categories by name or path.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Category",
  placeholder = "Search categories...",
  error,
  id = "category-picker",
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  /** Ids of the opened category at each column level. */
  const [trail, setTrail] = useState<string[]>([]);
  const [activeResult, setActiveResult] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const selectedPath = useMemo(
    () => (value ? getCategoryPath(categories, value) : []),
    [categories, value],
  );

  // Column 0 = top level; each opened category adds a column of its children.
  const columns = useMemo(() => {
    const cols: Category[][] = [getSiblings(categories, null)];
    for (const parentId of trail) {
      const kids = getSiblings(categories, parentId);
      if (!kids.length) break;
      cols.push(kids);
    }
    return cols;
  }, [categories, trail]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return getLeafCategories(categories)
      .map((c) => ({
        id: c.id,
        name: c.name,
        path: formatCategoryPath(getCategoryPath(categories, c.id)),
      }))
      .filter((r) => r.path.toLowerCase().includes(q))
      .sort((a, b) => {
        // Name matches first, then alphabetical by path.
        const an = a.name.toLowerCase().includes(q) ? 0 : 1;
        const bn = b.name.toLowerCase().includes(q) ? 0 : 1;
        return an - bn || a.path.localeCompare(b.path);
      })
      .slice(0, 50);
  }, [categories, query]);

  const openPicker = () => {
    if (open) return;
    // Re-open on the current selection so its siblings are visible.
    setTrail(selectedPath.slice(0, -1).map((c) => c.id));
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (categoryId: string) => {
    onChange(categoryId);
    close();
    inputRef.current?.blur();
  };

  const openCategory = (level: number, category: Category) => {
    if (!hasChildren(categories, category.id)) {
      select(category.id);
      return;
    }
    setTrail((t) => [...t.slice(0, level), category.id]);
  };

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the newest column in view on narrow screens.
  useEffect(() => {
    const el = columnsRef.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [columns.length]);

  useEffect(() => setActiveResult(0), [query]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        openPicker();
      }
      return;
    }
    if (!query.trim() || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveResult((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveResult((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[activeResult].id);
    }
  };

  const searching = query.trim().length > 0;
  const selectedText = formatCategoryPath(selectedPath);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-muted-foreground">
        {label}
      </label>

      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-[10px] border bg-white px-3 transition-colors",
          open ? "border-primary ring-2 ring-primary/15" : error ? "border-destructive" : "border-input",
        )}
        onClick={() => {
          openPicker();
          inputRef.current?.focus();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          aria-autocomplete="list"
          aria-invalid={!!error}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={!open && selectedText ? "" : placeholder}
          value={query}
          onFocus={openPicker}
          onChange={(e) => {
            setQuery(e.target.value);
            openPicker();
          }}
          onKeyDown={onKeyDown}
        />
        {/* Show the chosen path as real text when closed, so it doesn't look like a placeholder. */}
        {!open && selectedText && (
          <span className="pointer-events-none absolute left-10 right-16 truncate text-sm text-foreground">
            {selectedText}
          </span>
        )}
        {value && !open && (
          <button
            type="button"
            aria-label="Clear category"
            className="relative grid h-7 w-7 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </div>

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {open && (
        <div
          id={`${id}-panel`}
          className="absolute left-0 right-0 top-full z-30 mt-2 rounded-[12px] border bg-white p-2 shadow-lg"
        >
          {searching ? (
            <ul role="listbox" className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No last-level category matches &ldquo;{query.trim()}&rdquo;
                </li>
              ) : (
                results.map((r, i) => (
                  <li key={r.id} role="option" aria-selected={r.id === value}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-[8px] px-3 py-2.5 text-left",
                        i === activeResult ? "bg-accent" : "hover:bg-muted",
                      )}
                      onMouseEnter={() => setActiveResult(i)}
                      onClick={() => select(r.id)}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          <Highlight text={r.name} query={query.trim()} />
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          <Highlight text={r.path} query={query.trim()} />
                        </span>
                      </span>
                      {r.id === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <div
              ref={columnsRef}
              className="flex overflow-x-auto rounded-[10px] border"
            >
              {columns.map((col, level) => (
                <ul
                  key={level}
                  aria-label={level === 0 ? "Top-level categories" : `Level ${level + 1}`}
                  className="max-h-80 min-w-[150px] flex-1 shrink-0 overflow-y-auto border-r py-1 last:border-r-0"
                >
                  {col.map((cat) => {
                    const isOpen = trail[level] === cat.id;
                    const isSelected = cat.id === value;
                    const branch = hasChildren(categories, cat.id);
                    return (
                      <li key={cat.id}>
                        <button
                          type="button"
                          aria-expanded={branch ? isOpen : undefined}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-2 border-l-2 px-3 py-2.5 text-left text-sm",
                            isOpen
                              ? "border-primary bg-accent font-medium"
                              : isSelected
                                ? "border-transparent font-medium text-primary"
                                : "border-transparent hover:bg-muted",
                          )}
                          onClick={() => openCategory(level, cat)}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {cat.name}
                            {!cat.isActive && (
                              <span className="font-normal text-muted-foreground"> · inactive</span>
                            )}
                          </span>
                          {branch ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ))}
              {/* Empty filler column like the reference, until something is opened. */}
              {columns.length === 1 && (
                <div className="hidden min-w-[190px] flex-[3] items-center justify-center px-4 text-center text-[13px] text-muted-foreground sm:flex">
                  Pick a category to see its sub-categories
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
