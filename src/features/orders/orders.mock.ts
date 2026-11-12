// TEMPORARY: mock data until the orders API is ready.
// Delete this file once orders.api.ts is wired into the store.
import {
  ConfirmationCall,
  Order,
  OrderEvent,
  OrderStatus,
  Suborder,
  SuborderStatus,
} from "./orders.types";

const SELLERS: Record<string, string> = {
  "maria-b": "Maria B",
  "noor-jahan": "Noor Jahan",
  "j-dot": "J.",
  monanza: "Monanza",
};

const PRODUCTS = [
  "Embroidered lawn 3pc",
  "Chiffon maxi",
  "Printed pishwas",
  "Cotton sharara",
  "Khaddar kurta",
  "Silk dupatta set",
  "Linen co-ord",
  "Satarangi suit",
  "Kurta set",
  "Lawn suit",
];

const BUYERS: [string, string, string, string][] = [
  ["user-1", "Ayesha Khan", "Lahore", "Punjab"],
  ["user-2", "Bilal Raza", "Karachi", "Sindh"],
  ["user-3", "Hira Butt", "Islamabad", "ICT"],
  ["user-5", "Zainab Qureshi", "Faisalabad", "Punjab"],
  ["user-7", "Mahnoor Malik", "Karachi", "Sindh"],
  ["user-8", "Ali Sheikh", "Peshawar", "Khyber Pakhtunkhwa"],
  ["user-10", "Fahad Raza", "Lahore", "Punjab"],
];

const SHIPPING = 200;

const at = (hoursAgo: number) =>
  new Date(Date.parse("2026-11-10T20:00:00Z") - hoursAgo * 3600_000).toISOString();

const parcel = (
  orderNo: string,
  sellerId: string,
  items: [string, number, number][],
  status: SuborderStatus,
  extra: Partial<Suborder> = {},
): Suborder => {
  const subtotal = items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
  return {
    id: `${orderNo}-${sellerId}`,
    sellerId,
    sellerName: SELLERS[sellerId],
    status,
    items: items.map(([name, qty, unitPrice], i) => ({
      id: `${orderNo}-${sellerId}-${i}`,
      name,
      sku: `${sellerId.slice(0, 2).toUpperCase()}-${name.slice(0, 3).toUpperCase()}-${100 + i}`,
      size: ["S", "M", "L"][i % 3],
      qty,
      unitPrice,
    })),
    subtotal,
    shipping: SHIPPING,
    total: subtotal + SHIPPING,
    ...extra,
  };
};

const order = (
  n: number,
  buyerIndex: number,
  status: OrderStatus,
  suborders: Suborder[],
  hoursAgo: number,
  extra: Partial<Order> = {},
): Order => {
  const orderNumber = `ARY-${n}`;
  const [buyerId, buyerName, city, province] = BUYERS[buyerIndex % BUYERS.length];
  const placedAt = at(hoursAgo);
  const events: OrderEvent[] = [
    { id: `${orderNumber}-e0`, label: "Order placed", actor: buyerName, createdAt: placedAt },
  ];
  if (status !== "PENDING_CONFIRMATION" && extra.confirmedAt) {
    events.push({
      id: `${orderNumber}-e1`,
      label: "Confirmed on call",
      actor: extra.confirmedBy ?? "CSR",
      createdAt: extra.confirmedAt,
    });
  }
  return {
    id: orderNumber,
    orderNumber,
    buyerId,
    buyerName,
    contactPhone: `+92 3${String(10 + (n % 40)).padStart(2, "0")} ${String(1000000 + n * 7919).slice(-7)}`,
    address: { line1: `House ${n % 90}, Street ${1 + (n % 12)}`, city, province },
    paymentMethod: n % 5 === 0 ? "CARD" : "COD",
    paymentStatus: n % 5 === 0 ? "PAID" : status === "COMPLETED" ? "PAID" : "PENDING",
    status,
    subtotal: suborders.reduce((s, p) => s + p.subtotal, 0),
    shipping: suborders.reduce((s, p) => s + p.shipping, 0),
    total: suborders.reduce((s, p) => s + p.total, 0),
    placedAt,
    suborders,
    calls: [],
    events,
    ...extra,
  };
};

const call = (
  id: string,
  outcome: ConfirmationCall["outcome"],
  hoursAgo: number,
  note?: string,
): ConfirmationCall => ({ id, outcome, note, csrName: "Rabia (CSR)", calledAt: at(hoursAgo) });

/** The orders shown in the design, followed by generated history. */
const DESIGN_ORDERS: Order[] = [
  order(1042, 0, "PENDING_CONFIRMATION", [
    parcel("ARY-1042", "monanza", [["Satarangi suit", 1, 4800]], "AWAITING_CONFIRMATION"),
    parcel("ARY-1042", "noor-jahan", [["Kurta set", 1, 4800]], "AWAITING_CONFIRMATION"),
    parcel("ARY-1042", "j-dot", [["Lawn suit", 1, 4800]], "AWAITING_CONFIRMATION"),
  ], 1),
  order(1043, 1, "PENDING_CONFIRMATION", [
    parcel("ARY-1043", "maria-b", [["Printed pishwas", 1, 4000]], "AWAITING_CONFIRMATION"),
  ], 2),
  order(1044, 2, "PENDING_CONFIRMATION", [
    parcel("ARY-1044", "noor-jahan", [["Chiffon maxi", 1, 5500]], "AWAITING_CONFIRMATION"),
    parcel("ARY-1044", "j-dot", [["Linen co-ord", 1, 3900]], "AWAITING_CONFIRMATION"),
  ], 5, {
    calls: [call("ARY-1044-c1", "NO_ANSWER", 3, "Rang twice, no answer.")],
  }),
  order(1041, 3, "CONFIRMED", [
    parcel("ARY-1041", "maria-b", [["Khaddar kurta", 1, 4000]], "ACCEPTED", { dispatchBy: at(-24) }),
  ], 26, {
    confirmedAt: at(24),
    confirmedBy: "Rabia (CSR)",
    calls: [call("ARY-1041-c1", "CONFIRMED", 24)],
  }),
  order(1040, 4, "PARTIALLY_CANCELLED", [
    parcel("ARY-1040", "monanza", [["Cotton sharara", 1, 3700]], "READY_FOR_PICKUP", { dispatchBy: at(-12) }),
    parcel("ARY-1040", "maria-b", [["Silk dupatta set", 1, 5700]], "REJECTED", {
      cancelledBy: "SELLER",
      cancelReason: "Out of stock in size M.",
    }),
  ], 40, {
    confirmedAt: at(38),
    confirmedBy: "Rabia (CSR)",
    calls: [call("ARY-1040-c1", "CONFIRMED", 38)],
  }),
];

const GENERATED_STATUSES: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "CONFIRMED",
  "COMPLETED",
  "COMPLETED",
  "CANCELLED",
  "PENDING_CONFIRMATION",
  "COMPLETED",
];

const SELLER_IDS = Object.keys(SELLERS);

const GENERATED: Order[] = Array.from({ length: 22 }, (_, i) => {
  const n = 1039 - i;
  const no = `ARY-${n}`;
  const status = GENERATED_STATUSES[i % GENERATED_STATUSES.length];
  const parcelCount = 1 + (i % 3);
  const parcelStatus: SuborderStatus =
    status === "PENDING_CONFIRMATION"
      ? "AWAITING_CONFIRMATION"
      : status === "COMPLETED"
        ? "DELIVERED"
        : status === "CANCELLED"
          ? "CANCELLED"
          : (["NEW", "ACCEPTED", "PICKED_UP"] as const)[i % 3];
  const suborders = Array.from({ length: parcelCount }, (_, p) => {
    const sellerId = SELLER_IDS[(i + p) % SELLER_IDS.length];
    const product = PRODUCTS[(i * 3 + p) % PRODUCTS.length];
    const shipped = parcelStatus === "PICKED_UP" || parcelStatus === "DELIVERED";
    return parcel(no, sellerId, [[product, 1 + ((i + p) % 2), 3200 + ((i + p) % 5) * 600]], parcelStatus, {
      shipment: shipped
        ? {
            courier: "Leopards",
            trackingNo: `LP${String(70000000 + n * 13 + p)}`,
            status: parcelStatus === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
          }
        : null,
      ...(status === "CANCELLED" ? { cancelledBy: "CSR" as const, cancelReason: "Customer declined on call." } : {}),
    });
  });
  const hoursAgo = 48 + i * 11;
  const confirmed = status !== "PENDING_CONFIRMATION" && status !== "CANCELLED";
  return order(n, i + 1, status, suborders, hoursAgo, {
    confirmedAt: confirmed ? at(hoursAgo - 2) : null,
    confirmedBy: confirmed ? "Rabia (CSR)" : null,
    calls: confirmed
      ? [call(`${no}-c1`, "CONFIRMED", hoursAgo - 2)]
      : status === "CANCELLED"
        ? [call(`${no}-c1`, "CUSTOMER_DECLINED", hoursAgo - 2)]
        : [],
    ...(status === "CANCELLED"
      ? { cancelledBy: "CSR" as const, cancelReason: "Customer declined on call.", cancelledAt: at(hoursAgo - 2) }
      : {}),
  });
});

export const ORDERS_MOCK: Order[] = [...DESIGN_ORDERS, ...GENERATED].sort(
  (a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt),
);
