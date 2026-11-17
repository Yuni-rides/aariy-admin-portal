import type { Order, SuborderStatus } from "@/features/orders/orders.types";
import { itemsSummary } from "@/features/orders/orders.helpers";
import { EarningLine, SellerEarnings, SellerPayout } from "./payouts.types";

/** Parcels that are on their way; counted as "in progress", not payable yet. */
const IN_PROGRESS: SuborderStatus[] = ["NEW", "ACCEPTED", "READY_FOR_PICKUP", "PICKED_UP"];

/**
 * What a seller has earned and is owed. Only delivered parcels are payable;
 * commission is taken on the item value.
 * TODO(api): the backend calculates this (including withholding tax and the
 * COD remittance actually received from the courier); this mirrors it for the mock.
 */
export function computeSellerEarnings(
  sellerId: string,
  orders: Order[],
  payouts: SellerPayout[],
  rateBps: number,
): SellerEarnings {
  const lines: EarningLine[] = [];
  let inProgress = 0;

  for (const o of orders) {
    for (const s of o.suborders) {
      if (s.sellerId !== sellerId) continue;
      if (s.status === "DELIVERED") {
        const commission = Math.round((s.subtotal * rateBps) / 10000);
        lines.push({
          orderNumber: o.orderNumber,
          suborderId: s.id,
          date: o.placedAt,
          items: itemsSummary(s),
          subtotal: s.subtotal,
          commission,
          net: s.subtotal - commission,
        });
      } else if (IN_PROGRESS.includes(s.status)) {
        inProgress += s.subtotal;
      }
    }
  }

  const sum = (f: (l: EarningLine) => number) => lines.reduce((t, l) => t + f(l), 0);
  const gross = sum((l) => l.subtotal);
  const commission = sum((l) => l.commission);
  const net = gross - commission;
  const paid = payouts.filter((p) => p.sellerId === sellerId).reduce((t, p) => t + p.amount, 0);

  return {
    rateBps,
    lines: lines.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    inProgress,
    gross,
    commission,
    net,
    paid,
    balance: net - paid,
  };
}

export const ibanLast4 = (iban?: string | null) => (iban ? iban.replace(/\s/g, "").slice(-4) : "");
