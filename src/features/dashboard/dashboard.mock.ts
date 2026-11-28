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




export const SELLERS_MOCK: Seller[] = [
  {
    id: "seller-01",
    name: "Zoya Apparel Studio",
    legalName: "Zoya Apparel Studio (Pvt.) Ltd.",
    contactEmail: "zoya.apparel@example.com",
    contactPhone: "+92-300-1112233",
    idNumber: "42101-1234567-1",
    ntnNumber: "7654321-8",
    productCount: 24,
    tier: "STANDARD",
    status: "ONBOARDING",
    documents: [],
    reviewNote: null,
    createdAt: "2026-11-18T10:15:00.000Z",
    slug: "zoya-apparel-studio",
    logoUrl: null,
    rating: 4.6,
    reviewCount: 18,
    activeSale: null,
    bankAccount: null,
    businessAddress: "Plot 14, Block 6, PECHS, Karachi",
    taxStatus: "ACTIVE",
    payoutsEnabled: false,
    trainingCompletedAt: null,
    brand: {
      id: "brand-01",
      name: "Zoya Atelier",
      slug: "zoya-atelier",
      logoUrl: null,
      bannerUrl: null,
    },
    brands: [
      {
        id: "brand-01",
        name: "Zoya Atelier",
        slug: "zoya-atelier",
        logoUrl: null,
        bannerUrl: null,
      },
    ],
  },
  {
    id: "seller-02",
    name: "Mehran Heritage Crafts",
    legalName: "Mehran Heritage & Looms",
    contactEmail: "mehran.crafts@example.com",
    contactPhone: "+92-321-4455667",
    idNumber: "35202-7654321-3",
    ntnNumber: "8843219-2",
    productCount: 42,
    tier: "STANDARD",
    status: "APPROVED",
    documents: [],
    reviewNote: "KYB documents verified.",
    createdAt: "2026-11-10T09:00:00.000Z",
    slug: "mehran-heritage-crafts",
    logoUrl: null,
    rating: 4.9,
    reviewCount: 64,
    activeSale: null,
    bankAccount: null,
    businessAddress: "48 Mall Road, Gulberg III, Lahore",
    taxStatus: "ACTIVE",
    payoutsEnabled: true,
    trainingCompletedAt: "2026-11-12T11:30:00.000Z",
    brand: {
      id: "brand-02",
      name: "Mehran Looms",
      slug: "mehran-looms",
      logoUrl: null,
      bannerUrl: null,
    },
    brands: [
      {
        id: "brand-02",
        name: "Mehran Looms",
        slug: "mehran-looms",
        logoUrl: null,
        bannerUrl: null,
      },
    ],
  },
  {
    id: "seller-03",
    name: "Tariq Formal Wear Co.",
    legalName: "Tariq Formal Wear Enterprises",
    contactEmail: "tariq.formals@example.com",
    contactPhone: "+92-333-7788990",
    idNumber: "61101-9876543-9",
    ntnNumber: "5512340-6",
    productCount: 15,
    tier: "STANDARD",
    status: "ONBOARDING",
    documents: [],
    reviewNote: "Awaiting bank account proof confirmation.",
    createdAt: "2026-11-24T16:45:00.000Z",
    slug: "tariq-formal-wear",
    logoUrl: null,
    rating: null,
    reviewCount: 0,
    activeSale: null,
    bankAccount: null,
    businessAddress: "Blue Area, Sector F-7, Islamabad",
    taxStatus: "ACTIVE",
    payoutsEnabled: false,
    trainingCompletedAt: null,
    brand: {
      id: "brand-03",
      name: "Tariq Tailors",
      slug: "tariq-tailors",
      logoUrl: null,
      bannerUrl: null,
    },
    brands: [
      {
        id: "brand-03",
        name: "Tariq Tailors",
        slug: "tariq-tailors",
        logoUrl: null,
        bannerUrl: null,
      },
    ],
  },
];