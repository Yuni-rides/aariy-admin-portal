"use client";

import { useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_PRODUCT_IMAGES, MIN_PUBLISH_IMAGES } from "../products.helpers";
import { FieldError, FormCard } from "./ProductFormParts";

export type FormImage = { url: string; key?: string };

type ProductPhotosCardProps = {
  images: FormImage[];
  uploading: boolean;
  /** View mode: show the photos only, no adding, removing or reordering. */
  readOnly?: boolean;
  error?: string;
  onAdd: (files: File[]) => void;
  onChange: (images: FormImage[]) => void;
};

/** Photos: first is the cover; drag (or use the arrows) to reorder. */
export function ProductPhotosCard({ images, uploading, readOnly, error, onAdd, onChange }: ProductPhotosCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= images.length) return;
    const next = [...images];
    const [img] = next.splice(from, 1);
    next.splice(to, 0, img);
    onChange(next);
  };

  return (
    <FormCard
      id="h-img"
      title="Photos"
      description={
        readOnly
          ? `First photo is the cover. At least ${MIN_PUBLISH_IMAGES} are needed to publish.`
          : `First photo is the cover. Drag to reorder. At least ${MIN_PUBLISH_IMAGES} to publish, up to ${MAX_PRODUCT_IMAGES}.`
      }
    >
      <ul className="grid list-none grid-cols-3 gap-2.5 p-0">
        {images.map((img, i) => (
          <li
            key={img.url}
            draggable={!readOnly}
            onDragStart={() => setDragFrom(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(i);
            }}
            onDragLeave={() => setDragOver((o) => (o === i ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) move(dragFrom, i);
              setDragFrom(null);
              setDragOver(null);
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setDragOver(null);
            }}
            className={cn(
              "group relative aspect-[3/4] overflow-hidden rounded-lg bg-[#EFE3DB]",
              !readOnly && "cursor-grab active:cursor-grabbing",
              dragOver === i && dragFrom !== i && "ring-2 ring-[#A9461F]",
              dragFrom === i && "opacity-50",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`} className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 rounded bg-foreground px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Cover
              </span>
            )}
            {!readOnly && (
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-foreground/80 text-white"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            )}
            {/* Keyboard / touch alternative to dragging */}
            {!readOnly && (
            <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              {i > 0 && (
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} earlier`}
                  className="grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-white/90 text-xs"
                  onClick={() => move(i, i - 1)}
                >
                  ‹
                </button>
              )}
              {i < images.length - 1 && (
                <button
                  type="button"
                  aria-label={`Move photo ${i + 1} later`}
                  className="grid h-6 w-6 cursor-pointer place-items-center rounded-full bg-white/90 text-xs"
                  onClick={() => move(i, i + 1)}
                >
                  ›
                </button>
              )}
            </div>
            )}
          </li>
        ))}
        {!readOnly && images.length < MAX_PRODUCT_IMAGES && (
          <li>
            <button
              type="button"
              aria-label="Add photos"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-[#D2A48E] bg-[#FFF8F4] text-xs font-semibold text-[#A9461F] disabled:cursor-wait"
            >
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              {uploading ? "Uploading" : "Add"}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, MAX_PRODUCT_IMAGES - images.length);
          if (files.length) onAdd(files);
          e.target.value = "";
        }}
      />
      {readOnly && images.length === 0 && <p className="m-0 text-sm text-[#6B5E57]">No photos added.</p>}
      <FieldError>{error}</FieldError>
    </FormCard>
  );
}
