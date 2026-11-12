import type { StatusTone } from "@/components/ui/StatusBadge";
import { PlatformUser, UserStatus, UserType, UserView } from "./users.types";

export const userTypeLabelMap: Record<UserType, string> = {
  BUYER: "Buyer",
  SELLER: "Seller account",
};

export const userStatusLabelMap: Record<UserStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

export const userStatusToneMap: Record<UserStatus, StatusTone> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  DELETED: "neutral",
};

export const USER_VIEWS: { value: UserView; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DELETION_REQUESTED", label: "Deletion requests" },
  { value: "DELETED", label: "Deleted" },
];

export const USER_TYPE_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "BUYER", label: "Buyers" },
  { value: "SELLER", label: "Seller accounts" },
];

export const hasDeletionRequest = (u: PlatformUser) =>
  u.status === "ACTIVE" && !!u.deletionRequestedAt;

export function matchesView(u: PlatformUser, view: UserView = "ALL") {
  switch (view) {
    case "ALL":
      return true;
    case "DELETION_REQUESTED":
      return hasDeletionRequest(u);
    default:
      return u.status === view;
  }
}

/** Status badge for a row, showing a pending deletion request over "Active". */
export function getUserBadge(u: PlatformUser): { label: string; tone: StatusTone } {
  if (hasDeletionRequest(u)) return { label: "Deletion requested", tone: "warning" };
  return { label: userStatusLabelMap[u.status], tone: userStatusToneMap[u.status] };
}

export const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PK", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const formatAddress = (a: { line1: string; city: string; province: string; postalCode?: string }) =>
  [a.line1, a.city, a.province, a.postalCode].filter(Boolean).join(", ");
