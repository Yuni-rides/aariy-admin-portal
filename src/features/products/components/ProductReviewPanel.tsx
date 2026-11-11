"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import { formatPKR } from "@/lib/format";
import { Product } from "../products.types";
import {
  getProductPrice,
  getProductSummary,
  productStatusLabelMap,
  productStatusToneMap,
} from "../products.helpers";

type ProductReviewPanelProps = {
  product: Product;
  saving: boolean;
  onApprove: () => void;
  onReject: (reason: string) => Promise<boolean>;
};

export function ProductReviewPanel({
  product,
  saving,
  onApprove,
  onReject,
}: ProductReviewPanelProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    setReason("");
    setReasonError(null);
  }, [product.id]);

  const cover = product.images.find(Boolean);
  const isPending = product.status === "SUBMITTED" || product.status === "DRAFT";

  const handleReject = async () => {
    if (!reason.trim()) {
      setReasonError("Add a reason so the seller knows what to fix");
      return;
    }
    if (await onReject(reason)) setReason("");
  };

  return (
    <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[15px] font-semibold">
          {isPending ? "Review: " : ""}
          {product.name}
        </h2>
        <StatusBadge tone={productStatusToneMap[product.status]}>
          {productStatusLabelMap[product.status]}
        </StatusBadge>
      </div>

      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="h-[120px] w-full rounded-xl object-cover" />
      ) : (
        <div className="grid h-[120px] w-full place-items-center rounded-xl border border-dashed border-[#D9805B] bg-accent text-[#D9805B]">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}

      <p className="text-[13px] text-muted-foreground">{getProductSummary(product)}</p>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
        <dt className="text-muted-foreground">Seller</dt>
        <dd>{product.sellerName}</dd>
        <dt className="text-muted-foreground">Category</dt>
        <dd>{product.categoryName}</dd>
        <dt className="text-muted-foreground">Price</dt>
        <dd>{formatPKR(getProductPrice(product))}</dd>
        <dt className="text-muted-foreground">Stock</dt>
        <dd>{product.variants.reduce((sum, v) => sum + v.stock, 0)} units</dd>
      </dl>

      {product.rejectionReason && (
        <p className="rounded-[10px] bg-[#FDE5E5] px-3 py-2 text-[13px] text-[#A12A2A]">
          Rejected: {product.rejectionReason}
        </p>
      )}

      {product.status !== "REJECTED" && (
        <div>
          <Label htmlFor="reject-reason" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Rejection reason (required to reject)
          </Label>
          <Textarea
            id="reject-reason"
            rows={2}
            className="rounded-[10px] bg-white"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setReasonError(null);
            }}
            aria-invalid={!!reasonError}
          />
          {reasonError && <p className="mt-1 text-xs text-destructive">{reasonError}</p>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {product.status !== "APPROVED" && (
          <Button
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={onApprove}
          >
            Approve
          </Button>
        )}
        {product.status !== "REJECTED" && (
          <Button
            variant="secondary"
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={handleReject}
          >
            Reject
          </Button>
        )}
        <Button asChild variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]">
          <Link href={`/products/${product.id}/edit`}>
            {isPending ? "Edit before approval" : "Edit"}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
