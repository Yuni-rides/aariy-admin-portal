import type { StatusTone } from "@/components/ui/StatusBadge";
import { OrderStatus } from "./dashboard.types";

export const orderStatusLabelMap: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: "Pending confirmation",
  CONFIRMED: "Confirmed",
  PARTIALLY_CANCELLED: "Partially cancelled",
  CANCELLED: "Cancelled",
  DELIVERED: "Delivered",
};

export const orderStatusToneMap: Record<OrderStatus, StatusTone> = {
  PENDING_CONFIRMATION: "warning",
  CONFIRMED: "success",
  PARTIALLY_CANCELLED: "danger",
  CANCELLED: "danger",
  DELIVERED: "info",
};

export const STAT_CARDS = [
  { key: "ordersPendingConfirmation", label: "Orders pending confirmation" },
  { key: "sellersAwaitingApproval", label: "Sellers awaiting approval" },
  { key: "productsToModerate", label: "Products to moderate" },
  { key: "refundsWaiting", label: "Refunds waiting" },
] as const;
