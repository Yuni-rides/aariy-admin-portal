export { orderStatusLabelMap, orderStatusToneMap } from "@/features/orders/orders.helpers";

export const STAT_CARDS = [
  { key: "ordersPendingConfirmation", label: "Orders pending confirmation", href: "/orders" },
  { key: "sellersAwaitingApproval", label: "Sellers awaiting approval", href: "/sellers" },
  { key: "productsToModerate", label: "Products to moderate", href: "/products" },
  { key: "refundsWaiting", label: "Refunds waiting", href: undefined },
] as const;
