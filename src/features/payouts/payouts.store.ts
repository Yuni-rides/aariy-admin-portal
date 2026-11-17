import { create } from "zustand";
import { useAuditStore, auditActorName } from "@/features/audit/audit.store";
import { RecordTransferDto, SellerPayout } from "./payouts.types";
import { PAYOUTS_MOCK } from "./payouts.mock";

type Result = { success: boolean; message: string };

type PayoutsStore = {
  loading: boolean;
  saving: boolean;
  payouts: SellerPayout[];
  fetchPayouts: () => Promise<void>;
  /**
   * Records a bank transfer already made to the seller.
   * `balance` and `ibanLast4` come from the seller page so the amount can't exceed what is owed.
   */
  recordTransfer: (dto: RecordTransferDto, ctx: { balance: number; ibanLast4: string; sellerName: string }) => Promise<Result>;
};

export const usePayoutsStore = create<PayoutsStore>((set, get) => {
  const source = () => (get().payouts.length ? get().payouts : PAYOUTS_MOCK);

  return {
    loading: false,
    saving: false,
    payouts: [],

    fetchPayouts: async () => {
      set({ loading: true });
      // TODO(api): const res = await payoutsApi.getPayouts({ sellerId });
      set({ payouts: source(), loading: false });
    },

    recordTransfer: async (dto, ctx) => {
      const amount = Math.round(dto.amount);
      const reference = dto.reference.trim();
      if (!ctx.ibanLast4) return { success: false, message: "This seller has no bank account on file" };
      if (!(amount > 0)) return { success: false, message: "Enter an amount above 0" };
      if (amount > ctx.balance)
        return { success: false, message: "The amount is more than the seller is owed" };
      if (!reference) return { success: false, message: "Add the bank transaction reference" };
      if (source().some((p) => p.reference.toLowerCase() === reference.toLowerCase()))
        return { success: false, message: "This reference is already recorded" };
      if (!dto.paidAt || Date.parse(dto.paidAt) > Date.now())
        return { success: false, message: "Choose the date the transfer was made" };

      set({ saving: true });
      // TODO(api): await payoutsApi.recordTransfer(dto); — Finance role (Payouts → Create) only.
      const payout: SellerPayout = {
        id: `po-${Date.now()}`,
        sellerId: dto.sellerId,
        amount,
        reference,
        paidAt: new Date(dto.paidAt).toISOString(),
        ibanLast4: ctx.ibanLast4,
        note: dto.note?.trim() || null,
        recordedBy: auditActorName(),
        recordedAt: new Date().toISOString(),
      };
      set({ payouts: [payout, ...source()], saving: false });
      useAuditStore.getState().log({
        category: "PAYOUT",
        action: `Recorded transfer of PKR ${amount.toLocaleString("en-PK")}`,
        target: `Seller ${ctx.sellerName}`,
        reason: `Ref ${reference}`,
      });
      return { success: true, message: "Transfer recorded" };
    },
  };
});
