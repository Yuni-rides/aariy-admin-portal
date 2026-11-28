"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { CreateSellerDto, KybDocumentType } from "../sellers.types";
import {
  KYB_FILE_ACCEPT,
  KYB_MAX_FILE_MB,
  REQUIRED_KYB_DOCUMENTS,
  kybDocumentLabelMap,
  validateIdNumber,
  validateKybFile,
  validateNtn,
  validatePhone,
} from "../sellers.helpers";
import { useSellersStore } from "../sellers.store";
import { toast } from "@/hooks/useToast";
import { mediaApi } from "@/shared/api/media.api";
import { UploadedMediaItem } from "@/shared/api/media.types";

type AddSellerModalProps = {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateSellerDto) => Promise<boolean>;
};

type BusinessType = "PARTNERSHIP" | "COMPANY" | "SOLE_PROPRIETOR";
const BASE_REQUIRED_DOCS = [
  "NATIONAL_ID_FRONT",
  "NATIONAL_ID_BACK",
  "BANK_PROOF",
  "BRAND_AUTHORISATION",
  "TAX_CERTIFICATE",
  "SALES_TAX_CERTIFICATE",
] as const;

const PARTNERSHIP_REQUIRED_DOCS = [
  ...BASE_REQUIRED_DOCS,
  "PARTNERSHIP_DEED",
] as const;

type RequiredDocType =
  | (typeof BASE_REQUIRED_DOCS)[number]
  | "PARTNERSHIP_DEED";

function getRequiredDocs(businessType: BusinessType): readonly RequiredDocType[] {
  return businessType === "PARTNERSHIP"
    ? PARTNERSHIP_REQUIRED_DOCS
    : BASE_REQUIRED_DOCS;
}
type TaxStatusOption = "REGISTERED" | "NOT_REGISTERED";
type OtherDoc = { key: number; title: string; file: File | null };
type ProfileFormState = {
  // 1. Owner
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  // 2. Business
  businessType: BusinessType;
  legalName: string; //business name
  tradingName: string;
  countryId: string;
  countryName?: string;
  countryCode?: string;
  provinceId: string;
  provinceName?: string;
  cityId: string;
    cityName?: string;
    dispatchCityId?:string,

  dispatchDays: string;
  postalCode: string;
  businessAddress: string;
  // 3. Tax
  taxStatus: TaxStatusOption;
  idNumber: string;
  ntnNumber: string;
  // 4. Bank account
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  // 5. Brand
  name: string;
  slug: string;
  brandStory: string;
  bannerPreview: string | null;
  logoPreview: string | null;



  bannerFile: File | null;
  logoFile: File | null;

};

const EMPTY_FORM: ProfileFormState = {
  ownerName: "",
  contactPhone: "",
  contactEmail: "",
  businessType: "SOLE_PROPRIETOR",
  legalName: "",
  tradingName: "",
  countryId: "",
  countryName: "",
  countryCode: "",
  provinceId: "",
  provinceName: "",
  cityId: "",
  cityName:"",
  dispatchCityId:"",
  dispatchDays: "2",
  postalCode: "",
  businessAddress: "",
  taxStatus: "REGISTERED",
  idNumber: "",
  ntnNumber: "",
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  name: "",
  slug: "",
  brandStory: "",
  bannerPreview: null,
  logoPreview: null,

  bannerFile: null,
  logoFile: null,

};
const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "PARTNERSHIP", label: "Association of persons (partnership)" },
  { value: "COMPANY", label: "Company" },
  { value: "SOLE_PROPRIETOR", label: "Sole proprietor" },
];

const sectionCardClass =
  "flex flex-col gap-4 rounded-2xl border border-[#EADBC8] bg-white p-5";
const stepBadgeClass =
  "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#D9805B] text-xs font-semibold text-[#C8643B]";
const labelClass = "mb-1.5 block text-xs font-medium text-foreground/80";
const hintClass = "mt-1 text-xs text-muted-foreground";
const inputClass =
  "h-10 rounded-lg border-[#E5D8C7] bg-white text-sm focus-visible:ring-[#D9805B]";

const slugify = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
function validateForm(f: ProfileFormState) {
  const errors: Partial<Record<keyof ProfileFormState, string>> = {};

  if (!f.name.trim() && !f.tradingName.trim()) {
    errors.name = "Brand name is required";
  }
  if (!f.legalName.trim()) {
    errors.legalName = "Registered business name is required";
  }
  if (!/^\S+@\S+\.\S+$/.test(f.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid email";
  }

  const phoneErr = validatePhone(f.contactPhone);
  if (phoneErr) errors.contactPhone = phoneErr;

  if (!f.countryId) {
    errors.countryId = "Country is required";
  }
  if (!f.provinceId) {
    errors.provinceId = "Province is required";
  }
  if (!f.cityId) {
    errors.cityId = "Dispatch city is required";
  }
  if (!f.businessAddress.trim()) {
    errors.businessAddress = "Business address is required";
  }

  const idErr = validateIdNumber(f.idNumber);
  if (idErr) errors.idNumber = idErr;

  if (f.taxStatus === "REGISTERED") {
    const ntnErr = validateNtn(f.ntnNumber);
    if (ntnErr) errors.ntnNumber = ntnErr;
  }

  if (!f.bankName.trim()) {
    errors.bankName = "Bank name is required";
  }
  if (!f.accountTitle.trim()) {
    errors.accountTitle = "Account title is required";
  }
  if (!f.accountNumber.trim()) {
    errors.accountNumber = "Account number is required";
  }

  return errors;
}

function DocumentRow({
  label,
  hint,
  file,
  error,
  onPick,
  onRemove,
}: {
  label: string;
  hint?: string;
  file: File | null;
  error?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);


  return (
    <div className="flex flex-col">

      
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground/85">{label}</span>
        {file && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              className="cursor-pointer text-primary hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </button>
            <button
              type="button"
              aria-label={`Remove ${label}`}
              className="cursor-pointer text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              ×
            </button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={KYB_FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPick(picked);
          e.target.value = "";
        }}
      />

      {file ? (
        <div
          className={cn(
            "flex min-h-10 items-center justify-between gap-2 rounded-lg border bg-[#FAF6F1] px-3 py-2 text-xs",
            error ? "border-destructive" : "border-[#E5D8C7]"
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium text-foreground">
              {file.name}
            </span>
          </span>
          <span className="shrink-0 text-muted-foreground">
            {formatSize(file.size)}
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-dashed bg-[#FAF6F1]/70 px-3 py-2 text-left text-xs text-muted-foreground hover:border-[#D9805B] hover:text-foreground",
            error ? "border-destructive" : "border-[#E0CEBA]"
          )}
        >
          <span className="flex items-center gap-2">
            <Upload className="h-3.5 w-3.5 text-[#C8643B]" />
            Upload {label.toLowerCase()}
          </span>
          <span>Choose file</span>
        </button>
      )}

      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className={hintClass}>{hint}</p>
      )}
    </div>
  );
}

export function AddSellerModal({
  open,
  saving,
  onClose,
  onSubmit,
}: AddSellerModalProps) {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfileFormState, string>>
  >({});
  const [docs, setDocs] = useState<Partial<Record<RequiredDocType, File>>>({});
  const [docErrors, setDocErrors] = useState<
    Partial<Record<RequiredDocType, string>>
  >({});
  const [others, setOthers] = useState<OtherDoc[]>([]);
  const nextKey = useRef(0);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
      setErrors({});
      setDocs({});
      setDocErrors({});
      setOthers([]);
      setBannerKey(null);
    setLogoKey(null);
    setDocKeys({});
    setOtherDocKeys({});
    setUploadingSlot(null);
    }
  }, [open]);


  const [bannerKey, setBannerKey] = useState<string | null>(null);
const [logoKey, setLogoKey] = useState<string | null>(null);

const [docKeys, setDocKeys] = useState<Partial<Record<RequiredDocType, string>>>({});

// Extra OTHER docs ke keys (key: o.key -> uploaded key)
const [otherDocKeys, setOtherDocKeys] = useState<Record<number, string>>({});

// Kaun si file abhi upload ho rahi hai (e.g. "banner", "logo", "NATIONAL_ID_FRONT", "other-0")
const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const setField = <K extends keyof ProfileFormState>(
    key: K,
    value: ProfileFormState[K]
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && typeof value === "string" && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
console.log("[AddSellerModal] Owner details:", {
  ownerName: form.ownerName,
  contactPhone: form.contactPhone,
  contactEmail: form.contactEmail,
});

console.log("[AddSellerModal] Business form state:", {
  businessType: form.businessType,
  legalName: form.legalName,
  tradingName: form.tradingName,
  countryId: form.countryId,
  countryName: form.countryName,
  countryCode: form.countryCode,
  provinceId: form.provinceId,
  provinceName: form.provinceName,
  city: form.cityId,
  cityName:form.cityName,
  dispatchDays: form.dispatchDays,
  postalCode: form.postalCode,
  businessAddress: form.businessAddress,
});

console.log("[AddSellerModal] Tax form state:", {
  taxStatus: form.taxStatus,
  idNumber: form.idNumber,
  ntnNumber: form.ntnNumber,
});

console.log("[AddSellerModal] Bank form state:", {
  bankName: form.bankName,
  accountTitle: form.accountTitle,
  accountNumber: form.accountNumber,
  iban: form.iban,
});

console.log("[AddSellerModal] Brand form state:", {
  name: form.name,
  slug: form.slug,
  brandStory: form.brandStory,
  hasBannerFile: Boolean(form.bannerFile),
  hasLogoFile: Boolean(form.logoFile),
  bannerPreview: form.bannerPreview,
  logoPreview: form.logoPreview,
});


console.log("documents:", docKeys);

  if (e) e.preventDefault();

  if (uploadingSlot) {
    toast({
      variant: "destructive",
      title: "Please wait",
      description: "A file is still uploading.",
    });
    return;
  }

  const requiredDocs = getRequiredDocs(form.businessType);

  const nextErrors = validateForm(form);
  const nextDocErrors: Partial<Record<RequiredDocType, string>> = {};

  for (const type of requiredDocs) {
    if (!docs[type] || !docKeys[type]) {
      const docLabel =
        (kybDocumentLabelMap as Record<string, string | undefined>)[type] ??
        type.replaceAll("_", " ");
      nextDocErrors[type] = `${docLabel} is required`;
    }
  }

  setErrors(nextErrors);
  setDocErrors(nextDocErrors);
  if (Object.keys(nextErrors).length || Object.keys(nextDocErrors).length) {
    return;
  }

  const brandName = (form.name.trim() || form.tradingName.trim()).trim();
  const brandSlug = (form.slug.trim() || slugify(brandName)).trim();

  const uploadedDocuments: CreateSellerDto["documents"] = [
    ...requiredDocs
      .filter((type) => Boolean(docKeys[type]))
      .map((type) => ({
        type: type as KybDocumentType,
        key: docKeys[type]!,
      })),
    ...others
      .filter((o) => o.file && otherDocKeys[o.key])
      .map((o) => ({
        type: "OTHER" as KybDocumentType,
        title: o.title.trim() || "Other document",
        key: otherDocKeys[o.key],
      })),
  ];

  const payload: CreateSellerDto = {
    fullName: (form.ownerName.trim() || brandName).trim(),
    email: form.contactEmail.trim() || null,
    phone: form.contactPhone.trim() || null,
    businessName: brandName,
    businessTypeCode: form.businessType,
    business: {
      registeredName: form.legalName.trim(),
      tradingName: (form.tradingName.trim() || brandName).trim(),
      ...(form.countryId ? { countryId: form.countryId } : {}),
      ...(form.provinceId ? { provinceId: form.provinceId } : {}),
      ...(form.cityId ? { cityId: form.cityId } : {}),
      ...(form.dispatchCityId || form.cityId
        ? { dispatchCityId: form.dispatchCityId || form.cityId }
        : {}),
      // ...(form.cityName?.trim() ? { cityName: form.cityName.trim() } : {}),
      avgDispatchDays: Number(form.dispatchDays) || 2,
      // ...(form.postalCode.trim() ? { postalCode: form.postalCode.trim() } : {}),
      address: form.businessAddress.trim(),
    },
    tax: {
      cnic: form.idNumber.trim(),
      ntn: form.taxStatus === "REGISTERED" ? form.ntnNumber.trim() : "",
      taxStatus: form.taxStatus,
    },
    bank: {
      bankName: form.bankName.trim(),
      accountTitle: form.accountTitle.trim(),
      accountNumber: form.accountNumber.trim(),
      ...(form.iban.trim() ? { iban: form.iban.trim() } : {}),
    },
    brands: [
      {
        name: brandName,
        slug: brandSlug,
        ...(form.brandStory.trim()
          ? { brandStory: form.brandStory.trim() }
          : {}),
        logoKey,
        bannerKey,
      },
    ],
    documents: uploadedDocuments,
  };

  const ok = await onSubmit(payload);
  if (ok) onClose();

};

    //for countries

const { countries, loadingCountries, fetchCountries } = useSellersStore();

useEffect(() => {
  if (open && countries.length === 0) {
    fetchCountries({ page: 1, limit: 20 });
  }
}, [open, countries.length, fetchCountries]);

const { provinces, loadingProvinces, fetchProvinces } = useSellersStore();

//fetch provinces
useEffect(() => {
  if (open && form.countryCode) {
    fetchProvinces({ countryCode: form.countryCode, page: 1, limit: 20 });
  }
}, [open, form.countryCode, fetchProvinces]);



//for cities
const { cities,loadingCities, fetchCities } = useSellersStore();

useEffect(() => {
  if (open && cities.length === 0) {
    fetchCities({ page: 1, limit: 20,regionId:form.provinceId });
  }
}, [open, cities.length, fetchCities]);

//for upload media


const uploadSingleFile = async (
  file: File,
  slot: string
): Promise<string | null> => {
  setUploadingSlot(slot);
  try {
    const uploaded = await mediaApi.uploadFile(file, {
      fieldName: "file",
    });
    if (!uploaded?.key) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "File key was not returned by server.",
      });
      return null;
    }
    return uploaded.key;
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ||
      (err instanceof Error ? err.message : "File upload failed");

    toast({
      variant: "destructive",
      title: "Upload failed",
      description: message,
    });
    return null;
  } finally {
    setUploadingSlot(null);
  }
};

const handleImagePick = async (
  e: React.ChangeEvent<HTMLInputElement>,
  target: "banner" | "logo"
) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;

  const err = validateKybFile(file);
  if (err) {
    toast({
      variant: "destructive",
      title: "Invalid file",
      description: err,
    });
    return;
  }

  const previewUrl = URL.createObjectURL(file);

  setForm((prev) => {
    const oldPreview =
      target === "banner" ? prev.bannerPreview : prev.logoPreview;
    if (oldPreview && oldPreview.startsWith("blob:")) {
      URL.revokeObjectURL(oldPreview);
    }

    return target === "banner"
      ? {
          ...prev,
          bannerFile: file,
          bannerPreview: previewUrl,
        }
      : {
          ...prev,
          logoFile: file,
          logoPreview: previewUrl,
        };
  });

  setUploadingSlot(target);
  try {
    const uploaded = await mediaApi.uploadFile(file, {
      fieldName: "file",
    });
    if (target === "banner") {
      setBannerKey(uploaded.key);
    } else {
      setLogoKey(uploaded.key);
    }
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ||
      (err instanceof Error ? err.message : "File upload failed");

    toast({
      variant: "destructive",
      title: "Upload failed",
      description: message,
    });

    if (target === "banner") {
      setBannerKey(null);
      setForm((prev) => ({ ...prev, bannerFile: null }));
    } else {
      setLogoKey(null);
      setForm((prev) => ({ ...prev, logoFile: null }));
    }
  } finally {
    setUploadingSlot(null);
  }
};

const pickDoc = async (type: RequiredDocType, file: File) => {
  const err = validateKybFile(file);
  setDocErrors((prev) => ({ ...prev, [type]: err ?? undefined }));
  if (err) return;

  setDocs((prev) => ({ ...prev, [type]: file }));
  setUploadingSlot(type);

  try {
    const uploaded = await mediaApi.uploadFile(file, {
      fieldName: "file",
    });
    setDocKeys((prev) => ({ ...prev, [type]: uploaded.key }));
  } catch (uploadErr: unknown) {
    const message =
      (uploadErr as { response?: { data?: { message?: string } } })?.response
        ?.data?.message ||
      (uploadErr instanceof Error ? uploadErr.message : "Document upload failed");

    toast({
      variant: "destructive",
      title: "Upload failed",
      description: message,
    });

    setDocs((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
    setDocKeys((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  } finally {
    setUploadingSlot(null);
  }
};

const removeDoc = (type: RequiredDocType) => {
  setDocs((prev) => {
    const next = { ...prev };
    delete next[type];
    return next;
  });
  setDocKeys((prev) => {
    const next = { ...prev };
    delete next[type];
    return next;
  });
};
  return (
    <Modal
      open={open}
      onClose={onClose}
      className="h-auto max-h-[92vh] max-w-4xl"
    >

   
      <form
        onSubmit={handleSave}
        noValidate
        className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-[#FDFBF8] shadow-xl"
      >
        {/* Top Sticky Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EADBC8] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Brand profile
            </h2>
            <span className="rounded-full bg-[#F5EFE6] px-2.5 py-0.5 text-xs font-medium text-[#8A6D4B]">
              Draft / KYB
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 rounded-lg px-3.5 text-xs"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 rounded-lg bg-[#F3D9CE] px-4 text-xs font-semibold text-[#9E4726] hover:bg-[#EBC6B7]"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Scrollable 6-Section Body */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Deadline / Info Banner */}
          <div className="rounded-xl border border-[#F0D59B] bg-[#FFF8E7] px-4 py-3 text-xs text-[#6E5219]">
            <strong className="font-semibold">Complete profile details:</strong>{" "}
            Fill in owner, business, tax, bank, brand, and KYB document details
            before submitting for review.
          </div>

          {/* 1. Owner */}
          <section className={sectionCardClass}>
            <div className="flex items-center gap-2.5">
              <span className={stepBadgeClass}>1</span>
              <h3 className="text-sm font-semibold">Owner</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bp-owner-name" className={labelClass}>
                  Full name
                </Label>
                <Input
                  id="bp-owner-name"
                  className={inputClass}
                  placeholder="Owner full name"
                  value={form.ownerName}
                  onChange={(e) => setField("ownerName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bp-phone" className={labelClass}>
                  Mobile number
                </Label>
                <Input
                  id="bp-phone"
                  type="tel"
                  className={inputClass}
                  placeholder="+923001112222"
                  value={form.contactPhone}
                  onChange={(e) => setField("contactPhone", e.target.value)}
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.contactPhone}
                  </p>
                )}
              </div>
            </div>
            <div className="sm:max-w-[calc(50%-0.5rem)]">
              <Label htmlFor="bp-email" className={labelClass}>
                Email
              </Label>
              <Input
                id="bp-email"
                type="email"
                className={inputClass}
                placeholder="owner@example.com"
                value={form.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
              />
              {errors.contactEmail ? (
                <p className="mt-1 text-xs text-destructive">
                  {errors.contactEmail}
                </p>
              ) : (
                <p className={hintClass}>
                  Primary contact email for onboarding and notifications.
                </p>
              )}
            </div>
          </section>

          {/* 2. Business */}
          <section className={sectionCardClass}>
            <div className="flex items-center gap-2.5">
              <span className={stepBadgeClass}>2</span>
              <h3 className="text-sm font-semibold">Business</h3>
            </div>

            <div>
              <Label className={labelClass}>Business type</Label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {BUSINESS_TYPES.map((item) => {
                  const active = form.businessType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setField("businessType", item.value)}
                      className={cn(
                        "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs font-medium transition",
                        active
                          ? "border-[#C8643B] bg-[#FFF8F4] text-foreground"
                          : "border-[#E5D8C7] bg-white text-muted-foreground hover:border-[#D9805B]"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                          active ? "border-[#C8643B]" : "border-[#C9B9A6]"
                        )}
                      >
                        {active && (
                          <span className="h-2 w-2 rounded-full bg-[#C8643B]" />
                        )}
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bp-legal-name" className={labelClass}>
                  Registered business name
                </Label>
                <Input
                  id="bp-legal-name"
                  className={inputClass}
                  placeholder="Registered name"
                  value={form.legalName}
                  onChange={(e) => setField("legalName", e.target.value)}
                />
                {errors.legalName ? (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.legalName}
                  </p>
                ) : (
                  <p className={hintClass}>
                    As on your CNIC, NTN or registration.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="bp-trading-name" className={labelClass}>
                  Trading name
                </Label>
                <Input
                  id="bp-trading-name"
                  className={inputClass}
                  placeholder="Trading name"
                  value={form.tradingName}
                  onChange={(e) => setField("tradingName", e.target.value)}
                />
                <p className={hintClass}>
                  The name buyers see on the storefront.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
           <div>
  <Label htmlFor="bp-country" className={labelClass}>
    Country
  </Label>
  <select
    id="bp-country"
    disabled={loadingCountries}
    className={cn(inputClass, "w-full px-3")}
    value={form.countryId}
    onChange={(e) => {
      const pickedId = e.target.value;
      const picked = countries.find((c) => c.id === pickedId);

      const code = picked?.countryCode || picked?.code || "";
      setForm((prev) => ({
        ...prev,
     countryId: pickedId,
        countryName: picked?.name ?? "",
        countryCode: code,
        provinceId: "",
        provinceName: "",
      }));
      if (errors.countryId) {
        setErrors((prev) => ({ ...prev, countryId: undefined }));
      }
    }}
  >
    <option value="">
      {loadingCountries ? "Loading countries..." : "Select country"}
    </option>
    {countries.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
        {c.code ? ` (${c.code})` : ""}
      </option>
    ))}
  </select>
  {errors.countryId && (
    <p className="mt-1 text-xs text-destructive">{errors.countryId}</p>
  )}
</div>
        <div>
  <Label htmlFor="bp-province" className={labelClass}>
    Province / state
  </Label>
  <select
    id="bp-province"
    disabled={!form.countryCode || loadingProvinces}
    className={cn(inputClass, "w-full px-3")}
    value={form.provinceId}
    onChange={(e) => {
      const pickedId = e.target.value;
      const picked = provinces.find((p) => p.id === pickedId);
      setForm((prev) => ({
        ...prev,
        provinceId: pickedId,
        provinceName: picked?.name ?? "",
        cityId: "",
        dispatchCityId: "",
        city: "",
      }));
      if (errors.provinceId) {
        setErrors((prev) => ({ ...prev, provinceId: undefined }));
      }
      if (pickedId) {
        fetchCities({
          regionId: pickedId,
          page: 1,
          limit: 20,
        });
      }
    }}
  >
    <option value="">
      {!form.countryCode
        ? "Select country first"
        : loadingProvinces
          ? "Loading provinces..."
          : "Select province"}
    </option>
    {provinces.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name}
        {p.code ? ` (${p.code})` : ""}
      </option>
    ))}
  </select>
  {errors.provinceId && (
    <p className="mt-1 text-xs text-destructive">{errors.provinceId}</p>
  )}
</div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
         <div>
  <Label htmlFor="bp-city" className={labelClass}>
    Dispatch city
  </Label>
  <select
    id="bp-city"
    className={inputClass}
    value={form.cityId || ""}
    disabled={!form.provinceId || loadingCities}
    onChange={(e) => {
      const nextCityId = e.target.value;
      const matchedCity = cities.find((c) => c.id === nextCityId);
      setForm((prev) => ({
        ...prev,
        cityId: nextCityId,
                cityName: matchedCity?.name ?? "",

        dispatchCityId: nextCityId,
        city: matchedCity?.name ?? "",
      }));
    }}
  >
    <option value="">
      {!form.provinceId
        ? "Select province first"
        : loadingCities
        ? "Loading cities..."
        : "Select dispatch city"}
    </option>
    {cities.map((c) => (
      <option key={c.id} value={c.id}>
        {c.name}
      </option>
    ))}
  </select>
  <p className={hintClass}>Where parcels are collected from.</p>
</div>
              <div>
                <Label htmlFor="bp-dispatch-days" className={labelClass}>
                  Days to dispatch an order
                </Label>
                <Input
                  id="bp-dispatch-days"
                  type="number"
                  min={1}
                  className={inputClass}
                  value={form.dispatchDays}
                  onChange={(e) => setField("dispatchDays", e.target.value)}
                />
                <p className={hintClass}>
                  On average, from order to handing over.
                </p>
              </div>
            </div>

            <div className="sm:max-w-[calc(50%-0.5rem)]">
              <Label htmlFor="bp-postal" className={labelClass}>
                Postal code
              </Label>
              <Input
                id="bp-postal"
                className={inputClass}
                placeholder="e.g. 54000"
                value={form.postalCode}
                onChange={(e) => setField("postalCode", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="bp-address" className={labelClass}>
                Business address
              </Label>
              <Input
                id="bp-address"
                className={inputClass}
                placeholder="Shop or office address, with area and city."
                value={form.businessAddress}
                onChange={(e) => setField("businessAddress", e.target.value)}
              />
              <p className={hintClass}>
                Shop or office address, with area and city.
              </p>
            </div>
          </section>

          {/* 3. Tax */}
          <section className={sectionCardClass}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={stepBadgeClass}>3</span>
                <h3 className="text-sm font-semibold">Tax</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Tax &amp; identity verification details
              </span>
            </div>

            <div>
              <Label className={labelClass}>Tax status</Label>
              <div className="flex flex-wrap gap-2.5">
                {(
                  [
                    {
                      value: "REGISTERED",
                      label: "Registered (I have an NTN)",
                    },
                    { value: "NOT_REGISTERED", label: "Not registered" },
                  ] as const
                ).map((opt) => {
                  const active = form.taxStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField("taxStatus", opt.value)}
                      className={cn(
                        "flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium",
                        active
                          ? "border-[#C8643B] bg-[#FFF8F4] text-foreground"
                          : "border-[#E5D8C7] bg-white text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-3.5 w-3.5 place-items-center rounded-full border",
                          active ? "border-[#C8643B]" : "border-[#C9B9A6]"
                        )}
                      >
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C8643B]" />
                        )}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bp-cnic" className={labelClass}>
                  CNIC
                </Label>
                <Input
                  id="bp-cnic"
                  className={inputClass}
                  placeholder="12345-1234567-1"
                  value={form.idNumber}
                  onChange={(e) => setField("idNumber", e.target.value)}
                />
                {errors.idNumber && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.idNumber}
                  </p>
                )}
              </div>
              {form.taxStatus === "REGISTERED" && (
                <div>
                  <Label htmlFor="bp-ntn" className={labelClass}>
                    NTN
                  </Label>
                  <Input
                    id="bp-ntn"
                    className={inputClass}
                    placeholder="1234567-8"
                    value={form.ntnNumber}
                    onChange={(e) => setField("ntnNumber", e.target.value)}
                  />
                  {errors.ntnNumber && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.ntnNumber}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 4. Bank account for payouts */}
          <section className={sectionCardClass}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={stepBadgeClass}>4</span>
                <h3 className="text-sm font-semibold">
                  Bank account for payouts
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Payout destination details
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bp-bank" className={labelClass}>
                  Bank name
                </Label>
                <Input
                  id="bp-bank"
                  className={inputClass}
                  placeholder="HBL / Meezan Bank"
                  value={form.bankName}
                  onChange={(e) => setField("bankName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bp-acct-title" className={labelClass}>
                  Account title
                </Label>
                <Input
                  id="bp-acct-title"
                  className={inputClass}
                  placeholder="Account holder title"
                  value={form.accountTitle}
                  onChange={(e) => setField("accountTitle", e.target.value)}
                />
                <p className={hintClass}>
                  Should match your registered business name.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="bp-acct-no" className={labelClass}>
                  Account number
                </Label>
                <Input
                  id="bp-acct-no"
                  className={inputClass}
                  placeholder="Account number"
                  value={form.accountNumber}
                  onChange={(e) => setField("accountNumber", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bp-iban" className={labelClass}>
                  IBAN (optional)
                </Label>
                <Input
                  id="bp-iban"
                  className={inputClass}
                  placeholder="PK36..."
                  value={form.iban}
                  onChange={(e) => setField("iban", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* 5. Brand */}
          <section className={sectionCardClass}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className={stepBadgeClass}>5</span>
                <h3 className="text-sm font-semibold">Brand</h3>
              </div>
              <span className="text-[11px] text-muted-foreground">
                JPG, PNG or WEBP images, up to {KYB_MAX_FILE_MB} MB.
              </span>
            </div>

            <div>
              <Label className={labelClass}>Banner image (optional)</Label>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
onChange={(e) => handleImagePick(e, "banner")}              />
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5D8C7] bg-[#F5EFE6]">
                {form.bannerPreview ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.bannerPreview}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2.5 right-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="cursor-pointer rounded-md border border-[#E5D8C7] bg-white px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-accent"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("bannerPreview", null)}
                        className="cursor-pointer rounded-md border border-[#E5D8C7] bg-white px-2.5 py-1 text-xs font-medium text-destructive shadow-sm hover:bg-accent"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="cursor-pointer rounded-md border border-[#E5D8C7] bg-white px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent"
                  >
                    Upload banner
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
onChange={(e) => handleImagePick(e, "logo")}              />
              <div className="flex flex-col items-center gap-1.5">
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-[#E5D8C7] bg-[#F5EFE6] text-base font-semibold text-primary">
                  {form.logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoPreview}
                      alt="Brand logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (form.name || "B").slice(0, 1).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="cursor-pointer text-[11px] font-medium text-muted-foreground hover:text-primary"
                >
                  Change logo
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="bp-brand-name" className={labelClass}>
                Brand name
              </Label>
              <Input
                id="bp-brand-name"
                className={inputClass}
                placeholder="Brand name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bp-slug" className={labelClass}>
                Slug
              </Label>
              <Input
                id="bp-slug"
                className={inputClass}
                placeholder="brand-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setField("slug", slugify(e.target.value));
                }}
              />
              <p className={hintClass}>
                Made from the brand name. Used in your brand&apos;s web
                address.
              </p>
            </div>

            <div>
              <Label htmlFor="bp-story" className={labelClass}>
                Brand story (optional)
              </Label>
              <textarea
                id="bp-story"
                rows={3}
                className="w-full rounded-lg border border-[#E5D8C7] bg-white p-3 text-sm focus:border-[#D9805B] focus:outline-none"
                placeholder="Tell buyers about your brand..."
                value={form.brandStory}
                onChange={(e) => setField("brandStory", e.target.value)}
              />
            </div>
          </section>

          {/* 6. Documents */}
         <section className={sectionCardClass}>
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2.5">
      <span className={stepBadgeClass}>6</span>
      <h3 className="text-sm font-semibold">Documents</h3>
    </div>
    <span className="text-[11px] text-muted-foreground">
      JPG, PNG, WEBP or PDF, up to {KYB_MAX_FILE_MB} MB each.
    </span>
  </div>

  <div className="grid gap-4 sm:grid-cols-2">
    {getRequiredDocs(form.businessType).map((type) => {
      const docLabel =
        (kybDocumentLabelMap as Record<string, string | undefined>)[type] ??
        type.replaceAll("_", " ");

      return (
        <DocumentRow
          key={type}
          label={docLabel}
          file={docs[type] ?? null}
          error={docErrors[type]}
          onPick={(file) => pickDoc(type, file)}
          onRemove={() => removeDoc(type)}
        />
      );
    })}
  </div>

  {others.map((o) => (
    <div
      key={o.key}
      className="grid items-start gap-3 rounded-xl border border-[#EADBC8] bg-[#FAF6F1]/50 p-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <Label className={labelClass}>Document title</Label>
        <Input
          className={inputClass}
          placeholder="e.g. Trademark certificate or Shop rent agreement"
          value={o.title}
          onChange={(e) =>
            setOthers((list) =>
              list.map((item) =>
                item.key === o.key
                  ? { ...item, title: e.target.value }
                  : item
              )
            )
          }
        />
      </div>
      <DocumentRow
        label="File"
        file={o.file}
        onPick={(file) => {
          const err = validateKybFile(file);
          if (!err) {
            setOthers((list) =>
              list.map((item) =>
                item.key === o.key ? { ...item, file } : item
              )
            );
          }
        }}
        onRemove={() =>
          setOthers((list) =>
            list.map((item) =>
              item.key === o.key ? { ...item, file: null } : item
            )
          )
        }
      />
      <Button
        type="button"
        variant="ghost"
        className="mt-5 h-10 px-2.5 text-destructive"
        onClick={() =>
          setOthers((list) => list.filter((x) => x.key !== o.key))
        }
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ))}

  <div>
    <Button
      type="button"
      variant="secondary"
      className="h-9 rounded-lg text-xs"
      onClick={() =>
        setOthers((list) => [
          ...list,
          { key: nextKey.current++, title: "", file: null },
        ])
      }
    >
      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add extra document
    </Button>
  </div>
</section>
        </div>
      </form>
    </Modal>
  );
}