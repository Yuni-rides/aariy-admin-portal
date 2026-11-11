"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  loading,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-md">
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        )}
        <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            variant="secondary"
            className="cursor-pointer rounded-[10px]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            className="cursor-pointer rounded-[10px]"
            disabled={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
