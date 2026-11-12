"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/TextArea";

type CancelReasonDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  saving: boolean;
  onClose: () => void;
  /** Return true to close the dialog. */
  onConfirm: (reason: string) => Promise<boolean>;
};

export function CancelReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  saving,
  onClose,
  onConfirm,
}: CancelReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Add a reason. The buyer and seller see it.");
      return;
    }
    if (await onConfirm(reason.trim())) onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-md">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div>
          <Label htmlFor="cancel-reason" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Reason
          </Label>
          <Textarea
            id="cancel-reason"
            rows={3}
            className="rounded-[10px] bg-white"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError("");
            }}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
            Keep it
          </Button>
          <Button type="submit" variant="destructive" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
            {saving ? "Cancelling..." : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
