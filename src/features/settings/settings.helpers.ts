import type { StatusTone } from "@/components/ui/StatusBadge";
import type { Product } from "@/features/products/products.types";
import type { Seller } from "@/features/sellers/sellers.types";
import {
  BannerSlide,
  HomeBanner,
  PageStatus,
  Policies,
  SettingsTab,
  StoreInfo,
} from "./settings.types";

export const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: "STORE_INFO", label: "Store info" },
  { value: "POLICIES", label: "Policies" },
  { value: "PAGES", label: "Pages" },
  { value: "HOME_BANNER", label: "Home banner" },
];

export const pageStatusLabelMap: Record<PageStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

export const pageStatusToneMap: Record<PageStatus, StatusTone> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;
export const MAX_RETURN_WINDOW_DAYS = 60;
export const MAX_CONFIRMATION_TIMEOUT_HOURS = 168;

export const formatStamp = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export function validateStoreInfo(info: StoreInfo) {
  const e: Partial<Record<keyof StoreInfo, string>> = {};
  if (!info.storeName.trim()) e.storeName = "Store name is required";
  if (!/^\S+@\S+\.\S+$/.test(info.supportEmail.trim()))
    e.supportEmail = "Enter a valid email";
  if (!/^\+?[\d\s-]{7,16}$/.test(info.supportPhone.trim()))
    e.supportPhone = "Enter a valid phone number";
  if (info.whatsapp.trim() && !/^\+?[\d\s-]{7,16}$/.test(info.whatsapp.trim()))
    e.whatsapp = "Enter a valid number";
  for (const key of ["instagramUrl", "facebookUrl"] as const) {
    const v = info[key].trim();
    if (v && !/^https:\/\/\S+\.\S+/.test(v))
      e[key] = "Use a full link starting with https://";
  }
  return e;
}

export function validatePolicies(p: {
  returnWindowDays: string;
  confirmationTimeoutHours: string;
}) {
  const e: Partial<Record<keyof Policies, string>> = {};
  const days = Number(p.returnWindowDays);
  if (!/^\d+$/.test(p.returnWindowDays.trim()) || days > MAX_RETURN_WINDOW_DAYS)
    e.returnWindowDays = `Whole days from 0 to ${MAX_RETURN_WINDOW_DAYS}`;
  const hours = Number(p.confirmationTimeoutHours);
  if (
    !/^\d+$/.test(p.confirmationTimeoutHours.trim()) ||
    hours < 1 ||
    hours > MAX_CONFIRMATION_TIMEOUT_HOURS
  )
    e.confirmationTimeoutHours = `Whole hours from 1 to ${MAX_CONFIRMATION_TIMEOUT_HOURS}`;
  return e;
}

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Only http(s) and site-relative links survive, so pasted content can't inject javascript: URLs. */
const safeUrl = (url: string) => (/^(https?:\/\/|\/)/i.test(url) ? url : "#");

function inline(text: string) {
  return text
    .replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_, alt, url) =>
        `<img src="${safeUrl(url)}" alt="${alt}" class="my-2 max-w-full rounded-lg" />`,
    )
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, url) =>
        `<a href="${safeUrl(url)}" class="text-primary underline" target="_blank" rel="noopener noreferrer">${label}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
}

export function renderMarkdown(md: string) {
  const lines = escapeHtml(md).split(/\r?\n/);
  const html: string[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length)
      html.push(
        `<ul class="my-2 list-disc pl-5">${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`,
      );
    list = [];
  };
  const flushPara = () => {
    if (para.length) html.push(`<p class="my-2">${inline(para.join(" "))}</p>`);
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^##\s+/.test(line)) {
      flushList();
      flushPara();
      html.push(
        `<h2 class="mb-2 mt-4 text-lg font-semibold">${inline(line.replace(/^##\s+/, ""))}</h2>`,
      );
    } else if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (!line) {
      flushList();
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();
  return html.join("");
}

export const MAX_BANNER_SLIDES = 3;
export const MAX_BANNER_PRODUCTS = 4;
export const ROTATE_OPTIONS = [4, 6, 8, 10].map((s) => ({
  value: String(s),
  label: `${s} seconds`,
}));

export type LiveSlide = {
  sellerId: string;
  source: "PICKED" | "SALE";
  slide?: BannerSlide;
};

type BannerSeller = Pick<Seller, "id" | "name" | "status" | "activeSale">;

const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const isSaleRunning = (
  s: Pick<Seller, "activeSale">,
  now = new Date(),
) =>
  !!s.activeSale &&
  Date.parse(s.activeSale.startsAt) <= now.getTime() &&
  Date.parse(s.activeSale.endsAt) >= now.getTime();

export function getSlideIssue(
  slide: BannerSlide,
  seller: BannerSeller | undefined,
  today = isoDay(),
) {
  if (!slide.sellerId || !seller) return "Choose a brand";
  if (seller.status !== "APPROVED")
    return `${seller.name} isn't an approved seller`;
  if (!slide.isActive) return "Turned off";
  if (!slide.heroImageUrl) return "Add a hero image";
  if (slide.startsAt && slide.startsAt > today)
    return `Starts ${slide.startsAt}`;
  if (slide.endsAt && slide.endsAt < today) return `Ended ${slide.endsAt}`;
  return null;
}

export function resolveBanner(
  banner: HomeBanner,
  sellers: BannerSeller[],
  now = new Date(),
): LiveSlide[] {
  const byId = new Map(sellers.map((s) => [s.id, s]));
  const live: LiveSlide[] = banner.slides
    .filter(
      (slide) => !getSlideIssue(slide, byId.get(slide.sellerId), isoDay(now)),
    )
    .slice(0, MAX_BANNER_SLIDES)
    .map((slide) => ({ sellerId: slide.sellerId, source: "PICKED", slide }));

  if (banner.autoFillSales && live.length < MAX_BANNER_SLIDES) {
    const taken = new Set(live.map((l) => l.sellerId));
    const onSale = sellers
      .filter(
        (s) =>
          s.status === "APPROVED" && !taken.has(s.id) && isSaleRunning(s, now),
      )
      .sort(
        (a, b) =>
          b.activeSale!.discountPercent - a.activeSale!.discountPercent ||
          Date.parse(a.activeSale!.endsAt) - Date.parse(b.activeSale!.endsAt),
      );
    for (const s of onSale.slice(0, MAX_BANNER_SLIDES - live.length)) {
      live.push({ sellerId: s.id, source: "SALE" });
    }
  }
  return live;
}

export function getSlideProducts<
  P extends Pick<Product, "id" | "sellerId" | "status" | "createdAt">,
>(sellerId: string, productIds: string[], products: P[]): P[] {
  const approved = products.filter(
    (p) => p.sellerId === sellerId && p.status === "APPROVED",
  );
  if (productIds.length) {
    return productIds
      .map((id) => approved.find((p) => p.id === id))
      .filter((p): p is P => !!p)
      .slice(0, MAX_BANNER_PRODUCTS);
  }
  return [...approved]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_BANNER_PRODUCTS);
}

export function validateBanner(banner: HomeBanner) {
  const errors: Record<string, string> = {};
  if (banner.slides.length > MAX_BANNER_SLIDES)
    errors.form = `Up to ${MAX_BANNER_SLIDES} brands`;
  const seen = new Set<string>();
  for (const s of banner.slides) {
    if (!s.sellerId) errors[`${s.id}.seller`] = "Choose a brand";
    else if (seen.has(s.sellerId))
      errors[`${s.id}.seller`] = "This brand is already in the banner";
    seen.add(s.sellerId);
    if (s.productIds.length > MAX_BANNER_PRODUCTS)
      errors[`${s.id}.products`] = `Pick up to ${MAX_BANNER_PRODUCTS} products`;
    if (s.startsAt && s.endsAt && s.endsAt < s.startsAt)
      errors[`${s.id}.dates`] = "End date is before the start date";
  }
  return errors;
}

export const compactCount = (n?: number | null) =>
  n == null
    ? ""
    : n >= 1000
      ? `${Math.round(n / 100) / 10}k`.replace(".0k", "k")
      : String(n);

export const brandUrl = (seller: Pick<Seller, "slug" | "name">) =>
  `/brands/${
    seller.slug ??
    seller.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }`;
