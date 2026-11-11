"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryNode } from "../categories.types";

type CategoryTreeProps = {
  nodes: CategoryNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild?: (id: string) => void;
  canAddChild?: (id: string) => boolean;
};

export function CategoryTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  canAddChild,
}: CategoryTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const renderNode = (node: CategoryNode) => {
    const isOpen = !collapsed.has(node.id);
    const hasKids = node.children.length > 0;

    return (
      <li key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-[10px] pr-1.5 text-sm",
            selectedId === node.id
              ? "bg-accent font-semibold"
              : "hover:bg-muted",
          )}
          style={{ paddingLeft: (node.depth - 1) * 20 + 4 }}
        >
          {hasKids ? (
            <button
              type="button"
              aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => toggle(node.id)}
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-7 shrink-0" />
          )}
          <button
            type="button"
            className="flex-1 cursor-pointer truncate py-2.5 text-left"
            onClick={() => onSelect(node.id)}
          >
            {node.name}
            {!node.isActive && (
              <span className="font-normal text-muted-foreground"> · inactive</span>
            )}
          </button>
          {node.productCount > 0 && (
            <span className="px-1.5 text-xs text-muted-foreground" title="Products">
              {node.productCount}
            </span>
          )}
          {onAddChild && canAddChild?.(node.id) && (
            <button
              type="button"
              aria-label={`Add sub-category under ${node.name}`}
              title={`Add sub-category under ${node.name}`}
              className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-60 hover:bg-white hover:text-primary hover:opacity-100 group-hover:opacity-100"
              onClick={() => {
                // Expand the parent so the new child shows up once created.
                if (hasKids && !isOpen) toggle(node.id);
                onAddChild(node.id);
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasKids && isOpen && (
          <ul className="mt-0.5 space-y-0.5">{node.children.map(renderNode)}</ul>
        )}
      </li>
    );
  };

  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  return <ul className="space-y-0.5">{nodes.map(renderNode)}</ul>;
}
