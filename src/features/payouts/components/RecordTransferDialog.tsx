"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { formatPKR } from "@/lib/format";
import { maskAccount } from "@/lib/mask";
import type { SellerBankAccount } from "@/features/sellers/sellers.types";

type RecordTransferDialogProps = {
  open: boolean;
  sellerName: string;
  bank: SellerBankAccount;
  balance: number;
  saving: boolean;
  onClose: () => void;
  /** Return true to close the dialog. */
  onSubmit: (dto: { amount: number; reference: string; paidAt: string; note: string }) => Promise<boolean>;
};

const today = () => new Date().toISOString().slice(0, 10);
const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

/** Records a bank transfer Finance has already sent, so the seller's balance goes down. */
export function RecordTransferDialog({ open, sellerName, bank, balance, saving, onClose, onSubmit }: RecordTransferDialogProps) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmount(String(Math.max(0, balance)));
    setReference("");
    setPaidAt(today());
    setNote("");
    setError("");
  }, [open, balance]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return setError("Enter an amount above 0");
    if (value > balance) return setError(`The most you can record is ${formatPKR(balance)}`);
    if (!reference.trim()) return setError("Add the bank transaction reference");
    if (await onSubmit({ amount: value, reference, paidAt, note })) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">Record transfer to {sellerName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Make the transfer in the bank first, then record it here. Owed now: <b>{formatPKR(balance)}</b>
          </p>
        </div>

        <div className="rounded-xl border bg-muted/50 p-3 text-[13px]">
          <p className="text-muted-foreground">Send to</p>
          <p className="font-medium">{bank.accountTitle}</p>
          <p>
            {bank.bankName} · <span className="tabular-nums">{maskAccount(bank.iban)}</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tr-amount" className={labelClass}>Amount (PKR)</Label>
            <Input
              id="tr-amount"
              type="number"
              min={1}
              max={balance}
              className="h-11 rounded-[10px] bg-white"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
            />
          </div>
          <div>
            <Label htmlFor="tr-date" className={labelClass}>Transfer date</Label>
            <Input
              id="tr-date"
              type="date"
              max={today()}
              className="h-11 rounded-[10px] bg-white"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="tr-ref" className={labelClass}>Bank reference (IBFT / transaction ID)</Label>
          <Input
            id="tr-ref"
            className="h-11 rounded-[10px] bg-white"
            placeholder="e.g. IBFT-20261130-0201"
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              setError("");
            }}
          />
        </div>
        <div>
          <Label htmlFor="tr-note" className={labelClass}>Note (optional)</Label>
          <Input
            id="tr-note"
            className="h-11 rounded-[10px] bg-white"
            placeholder="e.g. November month-end batch"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
            {saving ? "Saving..." : "Record transfer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
