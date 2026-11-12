"use client";

import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Product } from "@/features/products/products.types";
import { getProductPrice } from "@/features/products/products.helpers";
import { Seller } from "@/features/sellers/sellers.types";
import { compactCount, getSlideProducts, LiveSlide } from "../settings.helpers";

type BannerPreviewProps = {
  slides: LiveSlide[];
  sellers: Seller[];
  products: Product[];
  rotateSeconds: number;
};

const FALLBACK_BG = "linear-gradient(135deg, #C9A27E 0%, #5B3A2E 100%)";

/** Scaled-down copy of the storefront home hero, so staff see what buyers will see. */
export function BannerPreview({ slides, sellers, products, rotateSeconds }: BannerPreviewProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), rotateSeconds * 1000);
    return () => clearInterval(t);
  }, [paused, slides.length, rotateSeconds]);

  if (slides.length === 0) {
    return (
      <div className="grid aspect-[21/9] place-items-center rounded-2xl border border-dashed bg-muted text-center text-sm text-muted-foreground">
        Nothing to show. Pick a brand or turn on brands on sale.
      </div>
    );
  }

  const current = slides[Math.min(index, slides.length - 1)];
  const seller = sellers.find((s) => s.id === current.sellerId);
  const items = getSlideProducts(current.sellerId, current.slide?.productIds ?? [], products);
  // Picked slides use their uploaded image; sale slides use the brand's own banner (not in mock data yet).
  const hero = current.slide?.heroImageUrl;

  return (
    <div
      className="relative overflow-hidden rounded-2xl text-white"
      style={{ background: hero ? `center / cover no-repeat url("${hero}")` : FALLBACK_BG }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Home banner preview"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#1F2433]/70 via-transparent to-black/10" />
      <div className="relative flex min-h-[260px] flex-col gap-4 p-5 sm:flex-row sm:items-stretch sm:justify-between sm:p-7">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold drop-shadow">{seller?.name ?? "Unknown brand"}</h3>
            {seller?.rating != null && (
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-white" /> {seller.rating} ({compactCount(seller.reviewCount)})
              </p>
            )}
            {current.source === "SALE" && seller?.activeSale && (
              <p className="mt-2 inline-block rounded-full bg-[#F07B4F] px-2.5 py-0.5 text-xs font-semibold">
                {seller.activeSale.title} · {seller.activeSale.discountPercent}% off
              </p>
            )}
            <span className="mt-4 block w-fit rounded-[10px] border border-white/70 bg-white/15 px-4 py-2 text-sm backdrop-blur">
              Shop all
            </span>
          </div>
          {slides.length > 1 && (
            <div className="flex gap-2" role="tablist" aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.sellerId}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1}`}
                  className={cn(
                    "h-2.5 w-2.5 cursor-pointer rounded-full border border-white/80",
                    i === index ? "bg-white" : "bg-white/30",
                  )}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 sm:w-[46%] sm:grid-cols-2 sm:gap-3">
          {items.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square overflow-hidden rounded-xl bg-[#EADBCB]"
              style={p.images[0] ? { background: `center / cover url("${p.images[0]}")` } : undefined}
            >
              {!p.images[0] && (
                <span className="absolute inset-0 grid place-items-center px-2 text-center text-[11px] font-medium text-[#6B4A3A]">
                  {p.name}
                </span>
              )}
              <Heart className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />
              <span className="absolute bottom-2 left-2 rounded-full bg-[#F07B4F] px-2 py-0.5 text-[11px] font-semibold">
                {formatPKR(getProductPrice(p))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
