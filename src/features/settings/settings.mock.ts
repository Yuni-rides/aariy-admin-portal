// TEMPORARY: mock data until the settings API is ready.
// Delete this file once settings.api.ts is wired into the store.
// Policy text below is placeholder only; legal pages get their text from counsel.
import { EditStamp, HomeBanner, Policies, StoreInfo, StorefrontPage } from "./settings.types";

const OPS = "Sara Malik (Finance)";

export const STORE_INFO_MOCK: StoreInfo = {
  storeName: "Aariy",
  supportEmail: "support@aariy.example",
  supportPhone: "+92 300 0000000",
  whatsapp: "+92 300 0000000",
  address: "[Registered business address]",
  instagramUrl: "https://instagram.com/aariy.example",
  facebookUrl: "",
};

export const POLICIES_MOCK: Policies = {
  returnWindowDays: 7,
  confirmationTimeoutHours: 48,
};

export const STAMPS_MOCK: Record<"storeInfo" | "policies" | "homeBanner", EditStamp> = {
  storeInfo: { updatedBy: OPS, updatedAt: "2026-11-02T10:15:00Z" },
  policies: { updatedBy: OPS, updatedAt: "2026-10-28T09:00:00Z" },
  homeBanner: { updatedBy: OPS, updatedAt: "2026-11-08T16:40:00Z" },
};

/** Stand-in hero image until real uploads exist (a warm gradient, like the storefront banner). */
const PLACEHOLDER_HERO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9A27E"/><stop offset="1" stop-color="#5B3A2E"/></linearGradient></defs><rect width="1600" height="700" fill="url(#g)"/></svg>',
  );

export const HOME_BANNER_MOCK: HomeBanner = {
  autoFillSales: true,
  rotateSeconds: 6,
  slides: [
    {
      id: "slide-maria",
      sellerId: "maria-b",
      heroImageUrl: PLACEHOLDER_HERO,
      productIds: [],
      startsAt: null,
      endsAt: null,
      isActive: true,
    },
    {
      id: "slide-zarveen",
      sellerId: "zarveen-couture",
      heroImageUrl: PLACEHOLDER_HERO,
      productIds: ["p-b1", "p-b2", "p-b3", "p-b4"],
      startsAt: "2026-11-05",
      endsAt: "2026-11-30",
      isActive: true,
    },
  ],
};

const placeholder = (title: string) =>
  `## ${title}\n\n[Page content, written or pasted by staff. Text for legal pages comes from counsel.]`;

const page = (
  id: string,
  title: string,
  slug: string,
  status: StorefrontPage["status"],
  content = placeholder(title),
): StorefrontPage => ({
  id,
  title,
  slug,
  content,
  metaTitle: `${title} | Aariy`,
  metaDescription: "",
  status,
  isSystem: true,
  updatedBy: OPS,
  updatedAt: "2026-11-05T12:00:00Z",
  publishedAt: status === "PUBLISHED" ? "2026-11-05T12:00:00Z" : null,
});

export const PAGES_MOCK: StorefrontPage[] = [
  page(
    "contact",
    "Contact us",
    "contact",
    "PUBLISHED",
    "## Contact us\n\nWe reply within one working day.\n\n- **Email:** support@aariy.example\n- **WhatsApp:** +92 300 0000000\n\nFor order questions, keep your order number (e.g. ARY-1042) ready.",
  ),
  page("privacy", "Privacy policy", "privacy-policy", "DRAFT"),
  page("terms", "Terms & Conditions", "terms", "DRAFT"),
  page("returns", "Returns policy", "returns", "DRAFT"),
  page("shipping", "Shipping policy", "shipping", "DRAFT"),
];
