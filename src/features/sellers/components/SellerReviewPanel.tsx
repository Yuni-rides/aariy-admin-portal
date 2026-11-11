"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import { Seller, SellerReviewAction } from "../sellers.types";
import {
  sellerStatusLabelMap,
  sellerStatusToneMap,
  sellerTierLabelMap,
  getDocumentLabel,
  kybDocumentStatusLabelMap,
  kybDocumentStatusToneMap,
  needsReview,
} from "../sellers.helpers";

type SellerReviewPanelProps = {
  seller: Seller;
  saving: boolean;
  onAction: (action: SellerReviewAction, note: string) => Promise<boolean>;
};

const actionsFor = (seller: Seller): { action: SellerReviewAction; label: string; primary?: boolean }[] => {
  switch (seller.status) {
    case "KYB_PENDING":
    case "CHANGES_REQUESTED":
      return [
        { action: "APPROVE", label: "Approve", primary: true },
        { action: "REQUEST_CHANGES", label: "Request changes" },
        { action: "REJECT", label: "Reject" },
      ];
    case "APPROVED":
      return [{ action: "SUSPEND", label: "Suspend" }];
    case "SUSPENDED":
      return [{ action: "REACTIVATE", label: "Reactivate", primary: true }];
    case "REJECTED":
      return [{ action: "APPROVE", label: "Approve", primary: true }];
  }
};

export function SellerReviewPanel({ seller, saving, onAction }: SellerReviewPanelProps) {
  const [note, setNote] = useState("");

  useEffect(() => setNote(""), [seller.id]);

  const handle = async (action: SellerReviewAction) => {
    const ok = await onAction(action, note);
    if (ok) setNote("");
  };

  return (
    <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-semibold">
          {seller.name} · {needsReview(seller.status) ? "KYB review" : "Details"}
        </h2>
        <StatusBadge tone={sellerStatusToneMap[seller.status]}>
          {sellerStatusLabelMap[seller.status]}
        </StatusBadge>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
        <dt className="text-muted-foreground">Legal entity</dt>
        <dd className="truncate">{seller.legalName}</dd>
        <dt className="text-muted-foreground">Email</dt>
        <dd className="truncate">{seller.contactEmail}</dd>
        <dt className="text-muted-foreground">Phone</dt>
        <dd>{seller.contactPhone || "—"}</dd>
        <dt className="text-muted-foreground">CNIC / SSN</dt>
        <dd>{seller.idNumber || "—"}</dd>
        <dt className="text-muted-foreground">NTN</dt>
        <dd>{seller.ntnNumber || "—"}</dd>
        <dt className="text-muted-foreground">Tier</dt>
        <dd>{sellerTierLabelMap[seller.tier]}</dd>
      </dl>

      <div className="flex flex-col gap-2 border-t pt-3">
        <h3 className="text-[13px] font-semibold">KYB documents</h3>
        {seller.documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {getDocumentLabel(doc)}
              {doc.type === "OTHER" && (
                <span className="text-muted-foreground"> · other</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-primary hover:underline"
                >
                  View
                </a>
              )}
              <StatusBadge tone={kybDocumentStatusToneMap[doc.status]}>
                {kybDocumentStatusLabelMap[doc.status]}
              </StatusBadge>
            </span>
          </div>
        ))}
      </div>

      {seller.reviewNote && (
        <p className="rounded-[10px] bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          Last note: {seller.reviewNote}
        </p>
      )}

      <div>
        <Label htmlFor="review-note" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
          Review note
        </Label>
        <Textarea
          id="review-note"
          rows={2}
          className="rounded-[10px] bg-white"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Required when requesting changes, rejecting or suspending"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {actionsFor(seller).map(({ action, label, primary }) => (
          <Button
            key={action}
            variant={primary ? "default" : "secondary"}
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={() => handle(action)}
          >
            {label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
