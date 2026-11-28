export type SellerStatus =
| "ONBOARDING"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type SellerTier = "STANDARD" | "PREMIUM";

export type KybDocumentType =
  |   "NATIONAL_ID_FRONT"
  |"NATIONAL_ID_BACK"
  |"BRAND_AUTHORISATION"
  | "TAX_CERTIFICATE"
  | "SALES_TAX_CERTIFICATE"
  | "BANK_PROOF"
  | "BRAND_AUTHORIZATION"
  /** Any extra supporting document; a seller can have several. */
  | "OTHER";

export type KybDocumentStatus = "UPLOADED" | "MISSING" | "REJECTED";

export type KybDocument = {
  /** Unique per seller; needed because there can be several OTHER documents. */
  id: string;
  type: KybDocumentType;
  status: KybDocumentStatus;
  /** Label for OTHER documents, e.g. "Trademark certificate". */
  title?: string;
  fileName?: string;
  url?: string | null;
};

/** A file picked in the form, before it is uploaded. */
export type KybDocumentUpload = {
  type: KybDocumentType;
  title?: string;
  file: File;
};

export type Seller = {
  id: string;
  name: string;
  legalName: string;
  contactEmail: string;
  contactPhone: string;
  /** CNIC (Pakistan) or SSN of the owner / authorised person. */
  idNumber: string;
  ntnNumber: string;
  productCount: number;
  tier: SellerTier;
  status: SellerStatus;
  documents: KybDocument[];
  reviewNote?: string | null;
  createdAt: string;
  /** Storefront brand page is /brands/{slug}. */
  slug?: string;
  logoUrl?: string | null;
  /** Average buyer rating and number of ratings, shown on the home banner. */
  rating?: number | null;
  reviewCount?: number | null;
  /** Sale the seller is running from the seller portal; such brands can fill the home banner. */
  activeSale?: SellerSale | null;
  /** Where payouts are sent. Checked against the bank proof document during KYB. */
  bankAccount?: SellerBankAccount | null;
  /** Pickup / business address. */
  businessAddress?: string | null;


  taxStatus?: string | null;
  payoutsEnabled?: boolean;
  trainingCompletedAt?: string | null;
  approval?: SellerApprovalInfo;


  brand?: SellerBrandListItem | null;
  brands?: SellerBrandListItem[];

};

export type SellerBankAccount = {
  bankName: string;
  /** Must match the legal name on KYB documents. */
  accountTitle: string;
  iban: string;
  taxStatus?: string | null;
  payoutsEnabled?: boolean;
  trainingCompletedAt?: string | null;
  approval?: SellerApprovalInfo;
};

export type SellerApprovalInfo = {
  submitted: boolean;
  trainingCompleted: boolean;
  cnicVerified: boolean;
  missingDocuments: string[];
  documentsPending: number;
  documentsRejected: number;
  canApprove: boolean;
  canReject: boolean;
  canSuspend: boolean;
  canReinstate: boolean;
  blockers: string[];
};
export type SellerSale = {
  title: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
};

export type SellersFilter = {
  status?: SellerStatus;
  tier?: SellerTier;
};
export type SellerBusinessPayload = {
  registeredName: string;
  tradingName: string;
  countryId?: string;
  provinceId?: string;
  cityId?: string;
  dispatchCityId?: string;
  cityName?: string;
  avgDispatchDays: number;
  postalCode?: string;
  address: string;
};

export type SellerTaxPayload = {
  cnic: string;
  ntn: string;
  taxStatus: "REGISTERED" | "NOT_REGISTERED";
};

export type SellerBankPayload = {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
};

export type SellerBrandPayload = {
  name: string;
  slug: string;
  brandStory?: string;
  logoKey: string | null;
  bannerKey: string | null;
};

export type SellerDocumentPayload = {
  type: KybDocumentType;
  key: string;
  title?: string;
};

export type CreateSellerDto = {
  fullName: string;
  email: string | null;
  phone: string | null;
  businessName: string;
  businessTypeCode: "PARTNERSHIP" | "COMPANY" | "SOLE_PROPRIETOR";
  business: SellerBusinessPayload;
  tax: SellerTaxPayload;
  bank: SellerBankPayload;
  brands: SellerBrandPayload[];
  documents: SellerDocumentPayload[];
  /** Defaults to STANDARD; tiers are managed separately. */
  tier?: SellerTier;
};

export type UpdateSellerDto = Partial<Omit<CreateSellerDto, "documents">> & {
  documents?: SellerDocumentPayload[];
};

export type CreateSellerApiResponse = {
  status?: boolean;
  success?: boolean;
  code?: string;
  message?: string;
  data?: {
    id?: string;
    sellerId?: string;
  };
  id?: string;
};

/** Decisions a super admin can take on a seller. */
export type SellerReviewAction =
  | "APPROVED"
  | "REQUEST_CHANGES"
  | "REJECTED"
  | "SUSPEND"
  | "REACTIVATE";

export type SellerResponse = {
  status: boolean;
  message: string;
  data?: { id: string };
};

export type GetSellersResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: Seller[];
    meta: { total: number; page: number; limit: number };
  };
};


//added
export type SellerCounts = Record<"ALL" | SellerStatus, number>;

export type SellerApiListItem = {
  id: string;
  name: string;
  registeredName: string | null;
  tradingName: string | null;
  owner: {
    fullName: string;
    email: string;
    phone: string;
  } | null;
  businessType: string | null;
  country: {
    id: string;
    code: string;
    name: string;
  } | null;
  city: {
    id: string;
    name: string;
  } | null;
  brands?: SellerBrandListItem[];
  status: SellerStatus;
  isLive: boolean;
  createdAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  deadline: {
    submitBy: string;
    daysLeft: number;
    message: string;
  } | null;
  documents: {
    total: number;
    accepted: number;
  };

brand?: SellerBrandListItem | null;
};
export type SellerBrandListItem = {
  id: string;
  name: string;
  slug: string;
  status?: string;
  isVerified?: boolean;
  logoUrl?: string | null;
  bannerUrl?: string | null;
};
export type GetSellersApiResponse = {
  status: boolean;
  code: string;
  message: string;
  data: {
    data: SellerApiListItem[];
    meta: {
      page: number;
      limit: number;
      total: number;
    };
    counts: SellerCounts;
  };
};

export type GetSellersParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: SellerStatus;
  tier?: SellerTier;
};




export type CountryItem = {
  id: string;
  name: string;
  code?: string;
  countryCode?: string;
  currency?: string;
  timezone?: string;
  defaultLocale?: string;
  isActive?: boolean;
  isAcceptingOrders?: boolean;
  provinces?: unknown[];
  cities?: unknown[];
};

export type CountriesApiResponse = {
  status: boolean;
  code?: string;
  message?: string;
  data?: {
    data?: CountryItem[];
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
    };
  };
};




//for province api


export type ProvinceCountry = {
  id: string;
  code: string;
  name: string;
};

export type ProvinceItem = {
  id: string;
  code: string;
  name: string;
  type?: "PROVINCE" | "TERRITORY" | string;
  countryCode: string;
  country?: ProvinceCountry;
};

export type RawProvince = {
  id?: unknown;
  code?: unknown;
  name?: unknown;
  type?: unknown;
  countryCode?: unknown;
  country?: {
    id?: unknown;
    code?: unknown;
    name?: unknown;
  } | null;
};

export type ProvincesResponse = {
  status: boolean;
  code?: string;
  message?: string;
  data?:
    | RawProvince[]
    | {
        data?: RawProvince[];
        meta?: {
          page?: number;
          limit?: number;
          total?: number;
        };
      };
};

export type GetProvincesParams = {
  countryCode: string;
  page?: number;
  limit?: number;
};


export type CityItem = {
  id: string;
  type?: string;
  name: string;
  isActive?: boolean;
  countryId?: string;
  regionId?: string;
};
