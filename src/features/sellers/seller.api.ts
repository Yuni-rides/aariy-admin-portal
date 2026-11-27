import { http } from "@/shared/api/http";
import {
  CityItem,
  CountriesApiResponse,
  
  CountryItem,
  CreateSellerApiResponse,
  CreateSellerDto,
  GetProvincesParams,
  GetSellersApiResponse,
  GetSellersParams,
  ProvinceItem,
  ProvincesResponse,
  RawProvince,
  Seller,
  SellerApiListItem,
  SellerCounts,
  SellerReviewAction,
  SellerStatus,
  
} from "./sellers.types";

const DEFAULT_COUNTS: SellerCounts = {
  ALL: 0,
  ONBOARDING: 0,
  SUBMITTED: 0,
  CHANGES_REQUESTED: 0,
  APPROVED: 0,
  REJECTED: 0,
  SUSPENDED: 0,
};

/** API list item ko aapke existing UI `Seller` type mein map karta hai */
export function mapApiSellerToUi(item: SellerApiListItem): Seller {
  const primaryBrand = item.brands?.[0] ?? null;

  return {
    id: item.id,
    name: item.name,
    legalName: item.registeredName ?? item.tradingName ?? item.name,
    contactEmail: item.owner?.email ?? "",
    contactPhone: item.owner?.phone ?? "",
    idNumber: "",
    ntnNumber: "",
    productCount: 0,
    tier: "STANDARD",
    status: item.status,
    documents: Array.from({ length: item.documents?.total ?? 0 }, (_, idx) => ({
      id: `${item.id}-doc-${idx}`,
      type: "OTHER",
      status: idx < (item.documents?.accepted ?? 0) ? "UPLOADED" : "MISSING",
    })),
    reviewNote: item.deadline?.message ?? null,
    createdAt: item.createdAt,
    ...(primaryBrand
      ? {
          brand: {
            id: primaryBrand.id,
            name: primaryBrand.name,
            slug: primaryBrand.slug,
            status: primaryBrand.status ?? "ACTIVE",
            isVerified: Boolean(primaryBrand.isVerified),
            logoUrl: primaryBrand.logoUrl ?? null,
            bannerUrl: primaryBrand.bannerUrl ?? null,
          },
        }
      : {}),
    brands: item.brands ?? [],
  };
}

export const sellersApi = {
  getSellers: async (
    params?: GetSellersParams
  ): Promise<{
    status: boolean;
    message: string;
    rows: Seller[];
    meta: { total: number; page: number; limit: number };
    counts: SellerCounts;
  }> => {

    console.log("[sellerapi][/admin/sellers] run ",)
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const search = params?.search?.trim();

    const res = await http.get<GetSellersApiResponse>("/admin/sellers", {
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.tier ? { tier: params.tier } : {}),
      },
    });

    const raw = res.data;
    const rawList = raw.data?.data ?? [];

    return {
      status: raw.status,
      message: raw.message,
      rows: rawList.map(mapApiSellerToUi),
      meta: {
        page: Number(raw.data?.meta?.page) || page,
        limit: Number(raw.data?.meta?.limit) || limit,
        total: Number(raw.data?.meta?.total) || 0,
      },
      counts: {
        ...DEFAULT_COUNTS,
        ...(raw.data?.counts ?? {}),
      },
    };
  },



getSellerById: async (
    id: string
  ): Promise<{ status: boolean; message: string; seller?: Seller }> => {
    const res = await http.get<{
      status: boolean;
      message: string;
      data: any;
    }>(`/admin/sellers/${id}`);
    console.log(`[sellerapi][/admin/sellers]${id} `,)

    const raw = res.data;
    if (!raw.status || !raw.data) {
      return { status: false, message: raw.message || "Seller not found" };
    }

    const d = raw.data;

    // 1. Name & Legal Name (detail endpoint mein `name` nahi hota, `tradingName` / `registeredName` hota hai)
    const displayName =
      d.name ?? d.tradingName ?? d.registeredName ?? "Unnamed Seller";
    const legalName =
      d.registeredName ?? d.tradingName ?? displayName;

    // 2. Identifiers array se CNIC aur NTN nikalna
    const identifiers: any[] = Array.isArray(d.identifiers) ? d.identifiers : [];
    const cnicEntry = identifiers.find(
      (i) => i.type === "CNIC" || i.type === "SSN" || i.kind === "CNIC"
    );
    const ntnEntry = identifiers.find(
      (i) => i.type === "NTN" || i.kind === "NTN"
    );

    // 3. BankAccounts array se primary ya pehla bank account nikalna
    const bankList: any[] = Array.isArray(d.bankAccounts)
      ? d.bankAccounts
      : d.bankAccount
        ? [d.bankAccount]
        : [];
    const primaryBank =
      bankList.find((b) => b.isPrimary || b.isDefault) ?? bankList[0] ?? null;

    // 4. Address build karna
    const formattedAddress =
      typeof d.address === "string" && d.address.trim()
        ? d.address.trim()
        : [
            d.address?.line1 ?? d.addressLine1,
            d.city?.name,
            d.province?.name,
            d.country?.name,
          ]
            .filter(Boolean)
            .join(", ") || null;

    // 5. Latest review note / suspension reason / deadline message
    const latestReview = Array.isArray(d.reviews) && d.reviews.length > 0
      ? d.reviews[d.reviews.length - 1]
      : null;

    const mapped: Seller = {
      id: d.id,
      name: displayName,
      legalName,
      contactEmail: d.contactEmail ?? d.owner?.email ?? "",
      contactPhone: d.contactPhone ?? d.owner?.phone ?? "",
      idNumber:
        cnicEntry?.value ?? cnicEntry?.number ?? d.owner?.cnic ?? d.cnic ?? "",
      ntnNumber: ntnEntry?.value ?? ntnEntry?.number ?? d.ntn ?? "",
      productCount: Number(d.productCount ?? d._count?.products ?? 0),
      tier: d.tier ?? "STANDARD",
      status: d.status,
      createdAt: d.createdAt,
      slug: d.brands?.[0]?.slug ?? d.slug,
      logoUrl: d.brands?.[0]?.logoUrl ?? d.logoUrl ?? null,
      businessAddress: formattedAddress,
      taxStatus: d.taxStatus ?? null,
      payoutsEnabled: Boolean(d.payoutsEnabled),
      trainingCompletedAt: d.trainingCompletedAt ?? null,
      approval: d.approval ?? undefined,
      reviewNote:
        d.suspensionReason ??
        latestReview?.note ??
        latestReview?.comment ??
        d.deadline?.message ??
        null,
      bankAccount: primaryBank
        ? {
            bankName: primaryBank.bankName ?? primaryBank.bank?.name ?? "",
            accountTitle: primaryBank.accountTitle ?? "",
            iban: primaryBank.iban ?? primaryBank.accountNumber ?? "",
          }
        : null,
      documents: Array.isArray(d.documents)
        ? d.documents.map((doc: any, idx: number) => ({
            id: doc.id ?? `${d.id}-doc-${idx}`,
            type: doc.type ?? doc.documentType ?? "OTHER",
            status:
              doc.status === "ACCEPTED" || doc.status === "VERIFIED"
                ? "UPLOADED"
                : doc.status === "REJECTED"
                  ? "REJECTED"
                  : doc.url || doc.fileUrl || doc.fileKey
                    ? "UPLOADED"
                    : "MISSING",
            title: doc.title ?? doc.label,
            fileName: doc.fileName,
            url: doc.url ?? doc.fileUrl ?? doc.file?.url ?? null,
          }))
        : [],
    };

    return {
      status: true,
      message: raw.message,
      seller: mapped,
    };
  },


  

reviewSeller: async (
    id: string,
    action: SellerReviewAction,
    note?: string
  ): Promise<{ status: boolean; message: string }> => {
    const trimmedNote = note?.trim();

    const payload: { status: SellerStatus; reason?: string } = {
      status: ACTION_TO_STATUS_MAP[action],
    };

    if (trimmedNote) {
      payload.reason = trimmedNote;
    }

    const res = await http.patch<{
      status: boolean;
      code?: string;
      message: string;
      data?: unknown;
    }>(`/admin/sellers/${id}/status`, payload);

    return {
      status: Boolean(res.data?.status),
      message: res.data?.message || "Status updated",
    };
  },


// Apne api object mein:
getCountries: async (params?: {
  page?: number;
  limit?: number;
}): Promise<CountryItem[]> => {
  const res = await http.get<CountriesApiResponse>("/countries", {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
    },
  });

  const list = res.data?.data?.data;
  if (!Array.isArray(list)) return [];

  return list
    .filter((c) => Boolean(c?.id && c?.name))
    .map((c) => ({
      id: String(c.id),
      name: String(c.name),
      code: c.code ? String(c.code) : undefined,
      countryCode: c.countryCode ? String(c.countryCode) : undefined,
      currency: c.currency,
      timezone: c.timezone,
      defaultLocale: c.defaultLocale,
      isActive: c.isActive,
      isAcceptingOrders: c.isAcceptingOrders,
      provinces: Array.isArray(c.provinces) ? c.provinces : [],
      cities: Array.isArray(c.cities) ? c.cities : [],
    }));
},




getProvinces: async ({
  countryCode,
  page = 1,
  limit = 20,
}: GetProvincesParams): Promise<ProvinceItem[]> => {
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  if (!normalizedCountryCode) return [];

  const res = await http.get<ProvincesResponse>("/provinces", {
    params: {
      countryCode: normalizedCountryCode,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    },
  });

  const payload = res.data?.data;
  const rawList: RawProvince[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return rawList
    .filter(
      (item): item is RawProvince & { id: string; name: string } =>
        Boolean(item) &&
        typeof item.id === "string" &&
        item.id.trim().length > 0 &&
        typeof item.name === "string" &&
        item.name.trim().length > 0
    )
    .map((item) => {
      const nestedCountry =
        item.country &&
        typeof item.country.id === "string" &&
        typeof item.country.name === "string"
          ? {
              id: item.country.id,
              code:
                typeof item.country.code === "string"
                  ? item.country.code
                  : normalizedCountryCode,
              name: item.country.name,
            }
          : undefined;

      const resolvedCountryCode =
        typeof item.countryCode === "string" && item.countryCode.trim()
          ? item.countryCode.trim().toUpperCase()
          : nestedCountry?.code ?? normalizedCountryCode;

      return {
        id: item.id.trim(),
        code: typeof item.code === "string" ? item.code.trim() : "",
        name: item.name.trim(),
        type: typeof item.type === "string" ? item.type : undefined,
        countryCode: resolvedCountryCode,
        ...(nestedCountry ? { country: nestedCountry } : {}),
      };
    });
},

getCities: async (params: {
  regionId: string;
  page?: number;
  limit?: number;
}): Promise<CityItem[]> => {
  const res = await http.get<{
    status?: boolean;
    data?: {
      data?: CityItem[];
    } | CityItem[];
  }>("/cities", {
    params: {
      regionId: params.regionId,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    },
  });

  const payload = res.data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
},


  createSeller: async (dto: CreateSellerDto) => {
    const res = await http.post<CreateSellerApiResponse>(
      "/admin/sellers",
      dto
    );
    return res.data;
  },

};
const ACTION_TO_STATUS_MAP: Record<SellerReviewAction, SellerStatus> = {
  APPROVED: "APPROVED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECTED: "REJECTED",
  SUSPEND: "SUSPENDED",
  REACTIVATE: "APPROVED",
};