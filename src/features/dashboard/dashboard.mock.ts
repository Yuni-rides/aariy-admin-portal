// TEMPORARY: mock data until the dashboard API is ready.
// Delete this file once dashboard.api.ts is wired into the store.
import { DashboardData } from "./dashboard.types";

export const DASHBOARD_MOCK: DashboardData = {
  stats: {
    ordersPendingConfirmation: 12,
    sellersAwaitingApproval: 5,
    productsToModerate: 28,
    refundsWaiting: 3,
  },
  recentOrders: [
    {
      id: "o-1042",
      orderNumber: "ARY-1042",
      sellerCount: 3,
      totalCod: 15000,
      status: "PENDING_CONFIRMATION",
      createdAt: "2026-11-10T10:12:00Z",
    },
    {
      id: "o-1041",
      orderNumber: "ARY-1041",
      sellerCount: 1,
      totalCod: 4200,
      status: "CONFIRMED",
      createdAt: "2026-11-10T08:40:00Z",
    },
    {
      id: "o-1040",
      orderNumber: "ARY-1040",
      sellerCount: 2,
      totalCod: 9800,
      status: "PARTIALLY_CANCELLED",
      createdAt: "2026-11-09T17:05:00Z",
    },
  ],
  attention: [
    { key: "kyb", label: "Seller KYB reviews", value: 5, tone: "warning", href: "/sellers" },
    { key: "products", label: "Product approvals", value: 28, tone: "warning", href: "/products" },
    { key: "csr", label: "Orders awaiting CSR call", value: 12, tone: "warning" },
    { key: "payout", label: "Payout batch for approval", value: "Month end", tone: "info" },
  ],
};
