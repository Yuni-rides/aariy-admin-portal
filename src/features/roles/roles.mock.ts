// TEMPORARY: mock data until the roles API is ready.
// Delete this file once roles.api.ts is wired into the store.
import { Role } from "./roles.types";

const STAMP = { updatedBy: "Test Admin", updatedAt: "2026-11-01T10:00:00Z" };

export const ROLES_MOCK: Role[] = [
  {
    id: "ADMIN",
    name: "Admin",
    description: "Runs the marketplace day to day. No access to staff, roles or money: payouts, refund approval and reconciliation stay with Finance.",
    isSystem: true,
    permissions: {
      DASHBOARD: ["VIEW", "EXPORT"],
      CATEGORIES: ["VIEW", "CREATE", "EDIT", "DELETE", "PUBLISH"],
      SELLERS: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
      PRODUCTS: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "PUBLISH", "EXPORT"],
      USERS: ["VIEW", "EDIT", "EXPORT", "MANAGE"],
      ORDERS: ["VIEW", "EDIT", "APPROVE", "EXPORT", "MANAGE"],
      REFUNDS: ["VIEW", "EDIT"],
      SUPPORT: ["VIEW", "CREATE", "EDIT", "MANAGE"],
      REPORTS: ["VIEW", "EXPORT"],
      // Can propose commission/tax changes; Finance approves them.
      TIERS: ["VIEW", "CREATE", "EDIT"],
      SETTINGS: ["VIEW", "EDIT", "PUBLISH"],
    },
    ...STAMP,
  },
  {
    id: "OPERATIONS",
    name: "Operations",
    description: "Catalogue, seller onboarding and order flow.",
    isSystem: true,
    permissions: {
      DASHBOARD: ["VIEW"],
      CATEGORIES: ["VIEW", "CREATE", "EDIT", "PUBLISH"],
      SELLERS: ["VIEW", "CREATE", "EDIT", "APPROVE"],
      PRODUCTS: ["VIEW", "CREATE", "EDIT", "APPROVE", "PUBLISH"],
      ORDERS: ["VIEW", "EDIT", "MANAGE"],
    },
    ...STAMP,
  },
  {
    id: "FINANCE",
    name: "Finance",
    description: "All money: payouts, refunds, reconciliation, commission and tax.",
    isSystem: true,
    permissions: {
      DASHBOARD: ["VIEW", "EXPORT"],
      SELLERS: ["VIEW"],
      ORDERS: ["VIEW", "EXPORT"],
      REFUNDS: ["VIEW", "APPROVE", "EXPORT"],
      PAYOUTS: ["VIEW", "CREATE", "APPROVE", "EXPORT"],
      RECONCILIATION: ["VIEW", "EDIT", "APPROVE", "EXPORT"],
      REPORTS: ["VIEW", "EXPORT"],
      TIERS: ["VIEW", "CREATE", "EDIT", "APPROVE"],
      AUDIT_LOG: ["VIEW"],
      PERSONAL_DATA: ["VIEW"],
    },
    ...STAMP,
  },
  {
    id: "SUPPORT",
    name: "Support",
    description: "Answers buyers and looks up their orders.",
    isSystem: true,
    permissions: {
      DASHBOARD: ["VIEW"],
      USERS: ["VIEW"],
      ORDERS: ["VIEW"],
      REFUNDS: ["VIEW", "EDIT"],
      SUPPORT: ["VIEW", "CREATE", "EDIT", "MANAGE"],
    },
    ...STAMP,
  },
  {
    id: "CSR",
    name: "CSR",
    description: "Calls buyers to confirm COD orders.",
    isSystem: true,
    permissions: {
      DASHBOARD: ["VIEW"],
      ORDERS: ["VIEW", "EDIT", "APPROVE"],
      USERS: ["VIEW"],
      SUPPORT: ["VIEW", "CREATE"],
    },
    ...STAMP,
  },
];
