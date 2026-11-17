// TEMPORARY: until the dashboard API is ready, the dashboard is built from the
// same mock data the list pages use, so the counts always match them.
// Delete this file once dashboard.api.ts is wired into the store.
import { Order } from "@/features/orders/orders.types";
import { Seller } from "@/features/sellers/sellers.types";
import { Product } from "@/features/products/products.types";
import { matchesTab } from "@/features/orders/orders.helpers";
import { needsReview } from "@/features/sellers/sellers.helpers";
import { DashboardData } from "./dashboard.types";

export function buildDashboard(orders: Order[], sellers: Seller[], products: Product[]): DashboardData {
  const ordersPending = orders.filter((o) => matchesTab(o, "PENDING_CONFIRMATION")).length;
  const sellersPending = sellers.filter((s) => needsReview(s.status)).length;
  const productsPending = products.filter((p) => p.status === "SUBMITTED").length;

  return {
    stats: {
      ordersPendingConfirmation: ordersPending,
      sellersAwaitingApproval: sellersPending,
      productsToModerate: productsPending,
      refundsWaiting: null,
    },
    recentOrders: [...orders]
      .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        sellerCount: o.suborders.length,
        totalCod: o.total,
        status: o.status,
        createdAt: o.placedAt,
      })),
    attention: [
      { key: "kyb", label: "Seller KYB reviews", value: sellersPending, tone: "warning", href: "/sellers" },
      { key: "products", label: "Product approvals", value: productsPending, tone: "warning", href: "/products" },
      { key: "csr", label: "Orders awaiting CSR call", value: ordersPending, tone: "warning", href: "/orders" },
      { key: "payout", label: "Payout batch for approval", value: "Month end", tone: "info" },
    ],
  };
}
