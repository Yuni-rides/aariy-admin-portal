export type SettingsTab = "STORE_INFO" | "POLICIES" | "PAGES" | "HOME_BANNER";

export type PageStatus = "DRAFT" | "PUBLISHED";

export type StorefrontPage = {
  id: string;
  title: string;
  /** Path on the storefront without the leading slash, e.g. "privacy-policy". */
  slug: string;
  /** Markdown written or pasted by staff. Legal text comes from counsel. */
  content: string;
  metaTitle: string;
  metaDescription: string;
  status: PageStatus;
  /** System pages (policies, contact) are linked from checkout and the footer, so they can't be deleted. */
  isSystem: boolean;
  updatedBy: string;
  updatedAt: string;
  publishedAt?: string | null;
};

export type SavePageDto = Pick<
  StorefrontPage,
  "title" | "slug" | "content" | "metaTitle" | "metaDescription"
>;

export type StoreInfo = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
};

export type Policies = {
  /** Days after delivery a buyer can request a return. 0 = no returns. */
  returnWindowDays: number;
  /** Hours an unconfirmed COD order holds stock before it is cancelled. */
  confirmationTimeoutHours: number;
};

/** One brand slide in the home page hero carousel. */
export type BannerSlide = {
  id: string;
  sellerId: string;
  /** Large lifestyle image behind the slide. Required before the slide can go live. */
  heroImageUrl: string | null;
  /** Up to 4 products shown on the right. Empty = the brand's newest approved products. */
  productIds: string[];
  /** YYYY-MM-DD; optional schedule window. */
  startsAt?: string | null;
  endsAt?: string | null;
  isActive: boolean;
};

export type HomeBanner = {
  /** Fill empty spots (up to 3) with approved brands running a sale. */
  autoFillSales: boolean;
  rotateSeconds: number;
  /** Brands picked by staff, in display order. */
  slides: BannerSlide[];
};

/** Who changed a settings section last; every change is also in the audit log. */
export type EditStamp = { updatedBy: string; updatedAt: string };

export type SettingsResponse = {
  status: boolean;
  message: string;
  data?: {
    storeInfo: StoreInfo;
    policies: Policies;
    pages: StorefrontPage[];
    homeBanner: HomeBanner;
  };
};
