/** A bank transfer Aariy made to a seller. */
export type SellerPayout = {
  id: string;
  sellerId: string;
  amount: number;
  /** Bank transaction / IBFT reference, used to match the bank statement. */
  reference: string;
  paidAt: string;
  /** Last 4 of the IBAN it was sent to, kept so a later bank change is visible. */
  ibanLast4: string;
  note?: string | null;
  recordedBy: string;
  recordedAt: string;
};

export type RecordTransferDto = {
  sellerId: string;
  amount: number;
  reference: string;
  paidAt: string;
  note?: string;
};

/** One delivered parcel and what the seller earns from it. */
export type EarningLine = {
  orderNumber: string;
  suborderId: string;
  date: string;
  items: string;
  /** Item value (excludes shipping, which is not the seller's). */
  subtotal: number;
  commission: number;
  net: number;
};

export type SellerEarnings = {
  /** Commission rate used, in basis points (1500 = 15%). */
  rateBps: number;
  lines: EarningLine[];
  /** Item value of parcels not delivered yet (not payable). */
  inProgress: number;
  gross: number;
  commission: number;
  net: number;
  paid: number;
  /** What Aariy still owes: net − paid. */
  balance: number;
};
