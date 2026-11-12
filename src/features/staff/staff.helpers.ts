import type { StatusTone } from "@/components/ui/StatusBadge";
import { StaffMember, StaffStatus } from "./staff.types";

export const staffStatusLabelMap: Record<StaffStatus, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  DEACTIVATED: "Deactivated",
};

export const staffStatusToneMap: Record<StaffStatus, StatusTone> = {
  ACTIVE: "success",
  PENDING: "warning",
  DEACTIVATED: "neutral",
};

/** Setup and reset links work once and expire after this many hours. */
export const LINK_TTL_HOURS = 48;

export const isLinkExpired = (m: Pick<StaffMember, "linkExpiresAt">, now = Date.now()) =>
  !!m.linkExpiresAt && Date.parse(m.linkExpiresAt) < now;

export const formatLastLogin = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PK", {
        day: "2-digit",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const formatExpiry = (iso: string) =>
  new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
