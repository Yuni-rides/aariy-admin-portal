import type { OrderStatus } from "@/features/orders/orders.types";

export type { OrderStatus };

/**
 * Each count uses exactly the filter of the matching list page, so the numbers agree:
 * - ordersPendingConfirmation: Orders → "Pending confirmation" tab
 * - sellersAwaitingApproval: Sellers with status KYB pending
 * - productsToModerate: Products → "Submitted" tab
 * - refundsWaiting: null until the Refunds module exists
 */
export type DashboardStats = {
  ordersPendingConfirmation: number;
  sellersAwaitingApproval: number;
  productsToModerate: number;
  refundsWaiting: number | null;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  sellerCount: number;
  totalCod: number;
  status: OrderStatus;
  createdAt: string;
};

export type AttentionItem = {
  key: string;
  label: string;
  /** Count, or a text label such as "Month end". */
  value: number | string;
  tone: "warning" | "info";
  href?: string;
};

export type DashboardData = {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  attention: AttentionItem[];
};

export type GetDashboardResponse = {
  status: boolean;
  message: string;
  data?: DashboardData;
};
