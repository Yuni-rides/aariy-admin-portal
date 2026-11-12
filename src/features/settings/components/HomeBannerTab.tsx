"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Product } from "@/features/products/products.types";
import { getProductPrice } from "@/features/products/products.helpers";
import { Seller } from "@/features/sellers/sellers.types";
import { BannerSlide, EditStamp, HomeBanner } from "../settings.types";
import {
  MAX_BANNER_PRODUCTS,
  MAX_BANNER_SLIDES,
  ROTATE_OPTIONS,
  brandUrl,
  formatStamp,
  getSlideIssue,
  getSlideProducts,
  isSaleRunning,
  resolveBanner,
  validateBanner,
} from "../settings.helpers";
import { BannerPreview } from "./BannerPreview";

type Result = { success: boolean; message: string };

type HomeBannerTabProps = {
  banner: HomeBanner;
  stamp?: EditStamp;
  sellers: Seller[];
  products: Product[];
  saving: boolean;
  onSave: (banner: HomeBanner) => Promise<Result>;
};

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

const newSlide = (): BannerSlide => ({
  id: `slide-${Date.now()}`,
  sellerId: "",
  heroImageUrl: null,
  productIds: [],
  startsAt: null,
  endsAt: null,
  isActive: true,
});

function SlideEditor({
  slide,
  index,
  count,
  sellers,
  products,
  takenSellerIds,
  errors,
  onChange,
  onMove,
  onRemove,
}: {
  slide: BannerSlide;
  index: number;
  count: number;
  sellers: Seller[];
  products: Product[];
  takenSellerIds: Set<string>;
  errors: Record<string, string>;
  onChange: (patch: Partial<BannerSlide>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const seller = sellers.find((s) => s.id === slide.sellerId);
  const issue = getSlideIssue(slide, seller);
  const brandProducts = products.filter((p) => p.sellerId === slide.sellerId && p.status === "APPROVED");
  const shown = getSlideProducts(slide.sellerId, slide.productIds, products);

  const sellerOptions = sellers
    .filter((s) => (s.status === "APPROVED" && !takenSellerIds.has(s.id)) || s.id === slide.sellerId)
    .map((s) => ({ value: s.id, label: s.name + (isSaleRunning(s) ? " · on sale" : "") }));

  const toggleProduct = (id: string) => {
    const has = slide.productIds.includes(id);
    if (!has && slide.productIds.length >= MAX_BANNER_PRODUCTS) return;
    onChange({ productIds: has ? slide.productIds.filter((x) => x !== id) : [...slide.productIds, id] });
  };

  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-sm font-semibold">{index + 1}</span>
          <h3 className="text-[15px] font-semibold">{seller?.name ?? "New slide"}</h3>
          {issue ? (
            <StatusBadge tone="warning">{issue}</StatusBadge>
          ) : (
            <StatusBadge tone="success">Live</StatusBadge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <label className="mr-2 flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
            <Switch checked={slide.isActive} onCheckedChange={(v) => onChange({ isActive: v })} aria-label="Show this slide" />
            Show
          </label>
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} className="cursor-pointer" onClick={() => onMove(-1)}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === count - 1} className="cursor-pointer" onClick={() => onMove(1)}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove slide" className="cursor-pointer text-destructive" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <div>
            <FilterSelect
              label="Brand"
              value={slide.sellerId}
              options={sellerOptions}
              placeholder="Choose an approved brand"
              onChange={(v) => onChange({ sellerId: v, productIds: [] })}
            />
            {errors[`${slide.id}.seller`] ? (
              <p className="mt-1 text-xs text-destructive">{errors[`${slide.id}.seller`]}</p>
            ) : (
              seller && <p className="mt-1 text-xs text-muted-foreground">Shop all opens {brandUrl(seller)}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor={`${slide.id}-from`} className={labelClass}>Show from (optional)</Label>
              <Input
                id={`${slide.id}-from`}
                type="date"
                className="h-11 rounded-[10px] bg-white"
                value={slide.startsAt ?? ""}
                onChange={(e) => onChange({ startsAt: e.target.value || null })}
              />
            </div>
            <div>
              <Label htmlFor={`${slide.id}-to`} className={labelClass}>Until (optional)</Label>
              <Input
                id={`${slide.id}-to`}
                type="date"
                className="h-11 rounded-[10px] bg-white"
                value={slide.endsAt ?? ""}
                onChange={(e) => onChange({ endsAt: e.target.value || null })}
              />
            </div>
          </div>
          {errors[`${slide.id}.dates`] && <p className="-mt-2 text-xs text-destructive">{errors[`${slide.id}.dates`]}</p>}
        </div>

        {/* Hero image */}
        <div className="flex flex-col gap-2">
          <span className={labelClass + " mb-0"}>Hero image</span>
          <button
            type="button"
            className={cn(
              "relative grid h-[120px] w-full cursor-pointer place-items-center overflow-hidden rounded-xl border md:w-[240px]",
              slide.heroImageUrl ? "border-input" : "border-dashed border-[#D9805B] bg-accent text-[#D9805B]",
            )}
            style={slide.heroImageUrl ? { background: `center / cover url("${slide.heroImageUrl}")` } : undefined}
            onClick={() => fileRef.current?.click()}
            aria-label={slide.heroImageUrl ? "Change hero image" : "Upload hero image"}
          >
            {!slide.heroImageUrl && (
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImagePlus className="h-5 w-5" /> Upload image
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // TODO(api): upload the file and keep the returned URL.
              if (file) onChange({ heroImageUrl: URL.createObjectURL(file) });
              e.target.value = "";
            }}
          />
          <p className="text-xs text-muted-foreground">Wide image, at least 1600×700.</p>
        </div>
      </div>

      {/* Products */}
      {slide.sellerId && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold">Products on the slide</span>
            <span className="text-xs text-muted-foreground">
              {slide.productIds.length
                ? `${slide.productIds.length} of ${MAX_BANNER_PRODUCTS} picked`
                : `None picked: shows the ${MAX_BANNER_PRODUCTS} newest`}
            </span>
          </div>
          {brandProducts.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">This brand has no approved products yet.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {brandProducts.map((p) => {
                const checked = slide.productIds.includes(p.id);
                const full = !checked && slide.productIds.length >= MAX_BANNER_PRODUCTS;
                const auto = !slide.productIds.length && shown.some((x) => x.id === p.id);
                return (
                  <li key={p.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2 text-sm",
                        checked ? "border-primary bg-accent/50" : "border-input",
                        full && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={full}
                        onCheckedChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 rounded"
                      />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      {auto && <span className="text-xs text-muted-foreground">auto</span>}
                      <span className="whitespace-nowrap text-xs text-muted-foreground">{formatPKR(getProductPrice(p))}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

export function HomeBannerTab({ banner, stamp, sellers, products, saving, onSave }: HomeBannerTabProps) {
  const [form, setForm] = useState<HomeBanner>(banner);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setForm(banner), [banner]);

  const dirty = JSON.stringify(form) !== JSON.stringify(banner);
  const live = useMemo(() => resolveBanner(form, sellers), [form, sellers]);
  const takenSellerIds = new Set(form.slides.map((s) => s.sellerId).filter(Boolean));
  const saleBrands = sellers.filter((s) => s.status === "APPROVED" && isSaleRunning(s));

  const updateSlide = (id: string, patch: Partial<BannerSlide>) =>
    setForm((f) => ({ ...f, slides: f.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const moveSlide = (index: number, dir: -1 | 1) =>
    setForm((f) => {
      const slides = [...f.slides];
      const [s] = slides.splice(index, 1);
      slides.splice(index + dir, 0, s);
      return { ...f, slides };
    });

  const save = async () => {
    const next = validateBanner(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSave(form);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Live preview */}
      <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Home banner</h2>
            <p className="text-[13px] text-muted-foreground">
              Up to {MAX_BANNER_SLIDES} brands rotate at the top of the home page. Pick brands yourself; brands
              running a sale can fill the empty spots.
            </p>
          </div>
          {dirty && <StatusBadge tone="warning">Not saved</StatusBadge>}
        </div>
        <BannerPreview slides={live} sellers={sellers} products={products} rotateSeconds={form.rotateSeconds} />
        <ol className="flex flex-wrap gap-2 text-[13px]">
          {live.map((l, i) => (
            <li key={l.sellerId} className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1">
              <span className="font-medium">
                {i + 1}. {sellers.find((s) => s.id === l.sellerId)?.name}
              </span>
              <StatusBadge tone={l.source === "PICKED" ? "info" : "warning"}>
                {l.source === "PICKED" ? "Picked" : "On sale"}
              </StatusBadge>
            </li>
          ))}
        </ol>
      </Card>

      {/* Settings */}
      <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none sm:flex-row sm:items-end sm:justify-between">
        <label className="flex cursor-pointer items-start gap-3">
          <Switch
            className="mt-0.5"
            checked={form.autoFillSales}
            onCheckedChange={(v) => setForm((f) => ({ ...f, autoFillSales: v }))}
            aria-label="Fill empty spots with brands on sale"
          />
          <span>
            <span className="block text-sm font-medium">Fill empty spots with brands on sale</span>
            <span className="block text-[13px] text-muted-foreground">
              {saleBrands.length
                ? `On sale now: ${saleBrands.map((s) => `${s.name} (${s.activeSale!.discountPercent}% off)`).join(", ")}. Biggest discount first.`
                : "No approved brand is running a sale right now."}
            </span>
          </span>
        </label>
        <FilterSelect
          label="Change slide every"
          value={String(form.rotateSeconds)}
          options={ROTATE_OPTIONS}
          className="max-w-[200px]"
          onChange={(v) => setForm((f) => ({ ...f, rotateSeconds: Number(v) }))}
        />
      </Card>

      {/* Picked slides */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold">
          Picked brands ({form.slides.length}/{MAX_BANNER_SLIDES})
        </h2>
        <Button
          variant="secondary"
          className="min-h-11 cursor-pointer rounded-[10px]"
          disabled={form.slides.length >= MAX_BANNER_SLIDES}
          title={form.slides.length >= MAX_BANNER_SLIDES ? `Up to ${MAX_BANNER_SLIDES} brands` : undefined}
          onClick={() => setForm((f) => ({ ...f, slides: [...f.slides, newSlide()] }))}
        >
          <Plus /> Add brand
        </Button>
      </div>

      {form.slides.length === 0 ? (
        <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground shadow-none">
          No picked brands. {form.autoFillSales ? "Brands on sale fill the banner." : "The banner is hidden."}
        </Card>
      ) : (
        form.slides.map((slide, i) => (
          <SlideEditor
            key={slide.id}
            slide={slide}
            index={i}
            count={form.slides.length}
            sellers={sellers}
            products={products}
            takenSellerIds={takenSellerIds}
            errors={errors}
            onChange={(patch) => updateSlide(slide.id, patch)}
            onMove={(dir) => moveSlide(i, dir)}
            onRemove={() => setForm((f) => ({ ...f, slides: f.slides.filter((s) => s.id !== slide.id) }))}
          />
        ))
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          Last edited by {stamp?.updatedBy ?? "—"}, {formatStamp(stamp?.updatedAt)}. Every change is logged.
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            disabled={!dirty || saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={() => {
              setForm(banner);
              setErrors({});
            }}
          >
            Discard changes
          </Button>
          <Button disabled={!dirty || saving} className="min-h-11 cursor-pointer rounded-[10px]" onClick={save}>
            {saving ? "Saving..." : "Save banner"}
          </Button>
        </div>
      </div>
    </div>
  );
}
