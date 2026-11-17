// TEMPORARY: mock data until the payouts API is ready.
// Delete this file once payouts.api.ts is wired into the store.
import { SellerPayout } from "./payouts.types";

export const PAYOUTS_MOCK: SellerPayout[] = [
  {
    id: "po-1",
    sellerId: "maria-b",
    amount: 6800,
    reference: "IBFT-20261031-0142",
    paidAt: "2026-10-31T11:00:00Z",
    ibanLast4: "3456",
    note: "October month-end batch",
    recordedBy: "Sara Malik",
    recordedAt: "2026-10-31T11:05:00Z",
  },
  {
    id: "po-2",
    sellerId: "monanza",
    amount: 5100,
    reference: "IBFT-20261031-0143",
    paidAt: "2026-10-31T11:10:00Z",
    ibanLast4: "1234",
    note: "October month-end batch",
    recordedBy: "Sara Malik",
    recordedAt: "2026-10-31T11:12:00Z",
  },
];
