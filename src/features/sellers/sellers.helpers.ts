import type { StatusTone } from "@/components/ui/StatusBadge";
import {
  SellerReviewAction,
  SellerStatus,
  SellerTier,
  KybDocument,
  KybDocumentStatus,
  KybDocumentType,
} from "./sellers.types";

export const sellerStatusLabelMap: Record<SellerStatus, string> = {
  KYB_PENDING: "KYB pending",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const sellerStatusToneMap: Record<SellerStatus, StatusTone> = {
  KYB_PENDING: "warning",
  APPROVED: "success",
  CHANGES_REQUESTED: "danger",
  REJECTED: "danger",
  SUSPENDED: "info",
};

export const sellerTierLabelMap: Record<SellerTier, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

export const SELLER_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  ...(Object.keys(sellerStatusLabelMap) as SellerStatus[]).map((value) => ({
    value,
    label: sellerStatusLabelMap[value],
  })),
];

export const SELLER_TIER_OPTIONS = [
  { value: "ALL", label: "All" },
  ...(Object.keys(sellerTierLabelMap) as SellerTier[]).map((value) => ({
    value,
    label: sellerTierLabelMap[value],
  })),
];

export const kybDocumentLabelMap: Record<KybDocumentType, string> = {
  CNIC_FRONT: "CNIC / ID front",
  CNIC_BACK: "CNIC / ID back",
  TAX_CERTIFICATE: "Tax certificate",
  SALES_TAX_CERTIFICATE: "Sales tax certificate",
  BANK_PROOF: "Bank proof",
  BRAND_AUTHORIZATION: "Brand authorization",
  OTHER: "Other document",
};

/** Documents every seller must have before it can be approved. */
export const REQUIRED_KYB_DOCUMENTS: Exclude<KybDocumentType, "OTHER">[] = [
  "CNIC_FRONT",
  "CNIC_BACK",
  "TAX_CERTIFICATE",
  "SALES_TAX_CERTIFICATE",
  "BANK_PROOF",
  "BRAND_AUTHORIZATION",
];

export const getDocumentLabel = (doc: { type: KybDocumentType; title?: string }) =>
  doc.type === "OTHER" && doc.title ? doc.title : kybDocumentLabelMap[doc.type];

/** True when every required document is uploaded. OTHER documents are optional. */
export const hasAllRequiredDocuments = (docs: KybDocument[]) =>
  REQUIRED_KYB_DOCUMENTS.every((type) =>
    docs.some((d) => d.type === type && d.status === "UPLOADED"),
  );

export const KYB_FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const KYB_MAX_FILE_MB = 5;

/** Returns an error message, or null when the file can be uploaded. */
export function validateKybFile(file: File): string | null {
  if (!KYB_FILE_ACCEPT.split(",").includes(file.type))
    return "Use a JPG, PNG, WEBP or PDF file";
  if (file.size > KYB_MAX_FILE_MB * 1024 * 1024)
    return `File must be under ${KYB_MAX_FILE_MB} MB`;
  return null;
}

const digits = (value: string) => value.replace(/\D/g, "");

/** CNIC is 13 digits (12345-1234567-1); SSN is 9 digits (123-45-6789). */
export function validateIdNumber(value: string): string | null {
  if (!value.trim()) return "CNIC / SSN number is required";
  if (!/^[\d-]+$/.test(value.trim())) return "Use numbers and dashes only";
  const n = digits(value).length;
  return n === 13 || n === 9 ? null : "Enter a 13-digit CNIC or 9-digit SSN";
}

/** NTN is 7 digits with an optional check digit (1234567-8), or a 13-digit CNIC-based NTN. */
export function validateNtn(value: string): string | null {
  if (!value.trim()) return "NTN number is required";
  if (!/^[\d-]+$/.test(value.trim())) return "Use numbers and dashes only";
  const n = digits(value).length;
  return n === 7 || n === 8 || n === 13 ? null : "Enter a valid NTN (e.g. 1234567-8)";
}

export function validatePhone(value: string): string | null {
  if (!value.trim()) return "Phone number is required";
  return /^\+?[\d\s-]{7,16}$/.test(value.trim()) ? null : "Enter a valid phone number";
}

export const kybDocumentStatusLabelMap: Record<KybDocumentStatus, string> = {
  UPLOADED: "Uploaded",
  MISSING: "Missing",
  REJECTED: "Rejected",
};

export const kybDocumentStatusToneMap: Record<KybDocumentStatus, StatusTone> = {
  UPLOADED: "success",
  MISSING: "warning",
  REJECTED: "danger",
};

export const reviewActionResultMap: Record<SellerReviewAction, SellerStatus> = {
  APPROVE: "APPROVED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REJECT: "REJECTED",
  SUSPEND: "SUSPENDED",
  REACTIVATE: "APPROVED",
};

/** Actions that must carry a note so the seller knows what to fix. */
export const NOTE_REQUIRED_ACTIONS: SellerReviewAction[] = [
  "REQUEST_CHANGES",
  "REJECT",
  "SUSPEND",
];

export const needsReview = (status: SellerStatus) => status === "KYB_PENDING";
