export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PARTIALLY_CANCELLED"
  | "CANCELLED"
  | "DELIVERED";

export type DashboardStats = {
  ordersPendingConfirmation: number;
  sellersAwaitingApproval: number;
  productsToModerate: number;
  refundsWaiting: number;
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
