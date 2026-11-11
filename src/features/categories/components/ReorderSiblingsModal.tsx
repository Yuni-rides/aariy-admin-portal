"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Category } from "../categories.types";

type ReorderSiblingsModalProps = {
  open: boolean;
  siblings: Category[];
  parentName: string;
  onClose: () => void;
  onSave: (orderedIds: string[]) => void;
};

export function ReorderSiblingsModal({
  open,
  siblings,
  parentName,
  onClose,
  onSave,
}: ReorderSiblingsModalProps) {
  const [items, setItems] = useState<Category[]>(siblings);

  useEffect(() => {
    if (open) setItems(siblings);
  }, [open, siblings]);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Reorder siblings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Menu order under {parentName}
        </p>

        <ol className="mt-4 max-h-[50vh] space-y-2 overflow-auto">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm"
            >
              <span className="w-5 text-muted-foreground">{index + 1}</span>
              <span className="flex-1 truncate">{item.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="cursor-pointer"
                aria-label={`Move ${item.name} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="cursor-pointer"
                aria-label={`Move ${item.name} down`}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown />
              </Button>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            className="cursor-pointer rounded-[10px]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="cursor-pointer rounded-[10px]"
            onClick={() => onSave(items.map((i) => i.id))}
          >
            Save order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
