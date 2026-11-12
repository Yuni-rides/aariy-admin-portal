export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "PARTIALLY_CANCELLED"
  | "CANCELLED"
  | "COMPLETED";

/** One parcel per seller; each is picked up from that seller separately. */
export type SuborderStatus =
  | "AWAITING_CONFIRMATION"
  | "NEW"
  | "ACCEPTED"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED"
  | "DELIVERY_FAILED";

export type PaymentMethod = "COD" | "CARD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type ConfirmationOutcome =
  | "CONFIRMED"
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "CUSTOMER_DECLINED"
  | "CALLBACK_REQUESTED";

export type CancelledBy = "CSR" | "SELLER" | "ADMIN" | "SYSTEM";

export type OrderTab = "PENDING_CONFIRMATION" | "CONFIRMED" | "PARTIALLY_CANCELLED" | "ALL";

export type OrderItem = {
  id: string;
  name: string;
  sku: string;
  size?: string;
  qty: number;
  unitPrice: number;
};

export type Shipment = {
  courier: string;
  trackingNo: string;
  status:
    | "PENDING_PICKUP"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "FAILED"
    | "RETURNED_TO_SELLER";
};

export type Suborder = {
  id: string;
  sellerId: string;
  sellerName: string;
  status: SuborderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  /** COD amount the courier collects for this parcel. */
  total: number;
  dispatchBy?: string | null;
  shipment?: Shipment | null;
  cancelledBy?: CancelledBy | null;
  cancelReason?: string | null;
};

export type ConfirmationCall = {
  id: string;
  outcome: ConfirmationOutcome;
  note?: string | null;
  csrName: string;
  calledAt: string;
};

export type OrderEvent = {
  id: string;
  label: string;
  actor: string;
  reason?: string | null;
  createdAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  /** Number the CSR calls to confirm. */
  contactPhone: string;
  address: { line1: string; city: string; province: string };
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  total: number;
  placedAt: string;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  cancelledBy?: CancelledBy | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  suborders: Suborder[];
  calls: ConfirmationCall[];
  events: OrderEvent[];
};

export type OrdersFilter = {
  tab?: OrderTab;
};

export type OrdersResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: Order[];
    meta: { total: number; page: number; limit: number };
  };
};
