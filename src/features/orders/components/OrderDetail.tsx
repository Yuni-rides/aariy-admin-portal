"use client";

import { forwardRef, useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ConfirmationOutcome, Order, Suborder } from "../orders.types";
import {
  CALL_OUTCOME_ACTIONS,
  callOutcomeLabelMap,
  callOutcomeToneMap,
  canCancelOrder,
  canCancelSuborder,
  formatOrderTime,
  isSuborderClosed,
  itemsSummary,
  orderStatusLabelMap,
  orderStatusToneMap,
  paymentStatusLabelMap,
  suborderStatusLabelMap,
  suborderStatusToneMap,
} from "../orders.helpers";
import { CancelReasonDialog } from "./CancelReasonDialog";

type Result = { success: boolean; message: string };

type OrderDetailProps = {
  order: Order;
  saving: boolean;
  onLogCall: (outcome: ConfirmationOutcome, note: string) => Promise<Result>;
  onCancelOrder: (reason: string) => Promise<Result>;
  onCancelSuborder: (suborderId: string, reason: string) => Promise<Result>;
};

type CancelTarget = { kind: "order" } | { kind: "parcel"; parcel: Suborder } | null;

export const OrderDetail = forwardRef<HTMLDivElement, OrderDetailProps>(function OrderDetail(
  { order, saving, onLogCall, onCancelOrder, onCancelSuborder },
  callLogRef,
) {
  const [note, setNote] = useState("");
  const [cancelTarget, setCancelTarget] = useState<CancelTarget>(null);

  useEffect(() => {
    setNote("");
    setCancelTarget(null);
  }, [order.id]);

  const pending = order.status === "PENDING_CONFIRMATION";
  const openTotal = order.suborders
    .filter((s) => !isSuborderClosed(s))
    .reduce((sum, s) => sum + s.total, 0);

  const handleCall = async (outcome: ConfirmationOutcome) => {
    const res = await onLogCall(outcome, note);
    if (res.success) setNote("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <Card className="flex flex-col gap-2 rounded-2xl p-[18px] shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">
              {order.orderNumber} · {order.paymentMethod === "COD" ? "COD" : "Card"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Buyer: {order.buyerName} ·{" "}
              <a href={`tel:${order.contactPhone.replace(/\s/g, "")}`} className="text-foreground hover:text-primary">
                {order.contactPhone}
              </a>{" "}
              · {order.address.city}
            </p>
          </div>
          <StatusBadge tone={orderStatusToneMap[order.status]}>
            {orderStatusLabelMap[order.status]}
          </StatusBadge>
        </div>
        <p className="text-[13px] text-muted-foreground">
          {pending
            ? "Stock held until confirmed or the timeout."
            : order.status === "CANCELLED"
              ? `Cancelled ${formatOrderTime(order.cancelledAt)}${order.cancelReason ? `: ${order.cancelReason}` : ""}`
              : `Confirmed ${formatOrderTime(order.confirmedAt)}${order.confirmedBy ? ` by ${order.confirmedBy}` : ""}`}
        </p>
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
          <dt className="text-muted-foreground">Placed</dt>
          <dd>{formatOrderTime(order.placedAt)}</dd>
          <dt className="text-muted-foreground">Deliver to</dt>
          <dd>
            {order.address.line1}, {order.address.city}, {order.address.province}
          </dd>
          <dt className="text-muted-foreground">Payment</dt>
          <dd>
            {order.paymentMethod === "COD" ? "Cash on delivery" : "Card"} ·{" "}
            {paymentStatusLabelMap[order.paymentStatus]}
          </dd>
        </dl>
      </Card>

      {/* Parcels */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <h3 className="mb-3 text-[15px] font-semibold">Parcels (one per seller, picked up separately)</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-2 py-2 font-medium">Seller</th>
                <th className="px-2 py-2 font-medium">Items</th>
                <th className="px-2 py-2 font-medium">Parcel total</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="w-0 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {order.suborders.map((s) => {
                const closed = isSuborderClosed(s);
                return (
                  <tr key={s.id} className="border-t align-top">
                    <td className="px-2 py-3 font-medium">{s.sellerName}</td>
                    <td className={cn("px-2 py-3", closed && "text-muted-foreground line-through")}>
                      {itemsSummary(s)}
                      {s.shipment && (
                        <p className="text-xs text-muted-foreground no-underline">
                          {s.shipment.courier} · {s.shipment.trackingNo}
                        </p>
                      )}
                      {s.cancelReason && (
                        <p className="text-xs text-destructive">{s.cancelReason}</p>
                      )}
                    </td>
                    <td className={cn("whitespace-nowrap px-2 py-3", closed && "text-muted-foreground line-through")}>
                      {formatPKR(s.total)}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge tone={suborderStatusToneMap[s.status]}>
                        {suborderStatusLabelMap[s.status]}
                      </StatusBadge>
                    </td>
                    <td className="px-2 py-2">
                      {!pending && canCancelSuborder(s) && order.suborders.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer rounded-[10px] text-destructive"
                          onClick={() => setCancelTarget({ kind: "parcel", parcel: s })}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-1 border-t pt-3 text-sm">
          <dt className="text-muted-foreground">Items</dt>
          <dd className="text-right">{formatPKR(order.subtotal)}</dd>
          <dt className="text-muted-foreground">Shipping</dt>
          <dd className="text-right">{formatPKR(order.shipping)}</dd>
          <dt className="font-semibold">Order total</dt>
          <dd className="text-right font-semibold">{formatPKR(order.total)}</dd>
          {openTotal !== order.total && order.status !== "CANCELLED" && (
            <>
              <dt className="text-muted-foreground">After cancellations</dt>
              <dd className="text-right">{formatPKR(openTotal)}</dd>
            </>
          )}
        </dl>
      </Card>

      {/* Confirmation call log */}
      <Card ref={callLogRef} className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
        <h3 className="text-[15px] font-semibold">Confirmation call log</h3>
        {order.calls.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No calls yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {order.calls.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p>
                    {c.csrName} · <span className="text-muted-foreground">{formatOrderTime(c.calledAt)}</span>
                  </p>
                  {c.note && <p className="text-[13px] text-muted-foreground">{c.note}</p>}
                </div>
                <StatusBadge tone={callOutcomeToneMap[c.outcome]}>{callOutcomeLabelMap[c.outcome]}</StatusBadge>
              </li>
            ))}
          </ul>
        )}

        {pending && (
          <>
            <div className="border-t pt-3">
              <Label htmlFor="call-note" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
                Call note (optional)
              </Label>
              <Textarea
                id="call-note"
                rows={2}
                className="rounded-[10px] bg-white"
                placeholder="e.g. Asked to deliver after 5 pm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]">
                <a href={`tel:${order.contactPhone.replace(/\s/g, "")}`}>
                  <Phone /> {order.contactPhone}
                </a>
              </Button>
              {CALL_OUTCOME_ACTIONS.map(({ outcome, label }) => (
                <Button
                  key={outcome}
                  variant={outcome === "CONFIRMED" ? "default" : "secondary"}
                  disabled={saving}
                  className={cn(
                    "min-h-11 cursor-pointer rounded-[10px]",
                    outcome === "CUSTOMER_DECLINED" && "text-destructive",
                  )}
                  onClick={() => handleCall(outcome)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Activity */}
      <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold">Activity</h3>
          {!pending && canCancelOrder(order) && (
            <Button
              variant="ghost"
              className="min-h-11 cursor-pointer rounded-[10px] text-destructive"
              onClick={() => setCancelTarget({ kind: "order" })}
            >
              Cancel order
            </Button>
          )}
        </div>
        <ol className="flex flex-col gap-2.5 border-l pl-4">
          {[...order.events].reverse().map((e) => (
            <li key={e.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
              <p>
                {e.label} <span className="text-muted-foreground">· {e.actor}</span>
              </p>
              {e.reason && <p className="text-[13px] text-muted-foreground">{e.reason}</p>}
              <p className="text-xs text-muted-foreground">{formatOrderTime(e.createdAt)}</p>
            </li>
          ))}
        </ol>
      </Card>

      <CancelReasonDialog
        open={cancelTarget !== null}
        saving={saving}
        title={
          cancelTarget?.kind === "parcel"
            ? `Cancel the ${cancelTarget.parcel.sellerName} parcel?`
            : `Cancel ${order.orderNumber}?`
        }
        description={
          cancelTarget?.kind === "parcel"
            ? "Only this parcel is cancelled. The rest of the order carries on."
            : "Every parcel not yet with the courier is cancelled and held stock is released."
        }
        confirmLabel={cancelTarget?.kind === "parcel" ? "Cancel parcel" : "Cancel order"}
        onClose={() => setCancelTarget(null)}
        onConfirm={async (reason) => {
          const res =
            cancelTarget?.kind === "parcel"
              ? await onCancelSuborder(cancelTarget.parcel.id, reason)
              : await onCancelOrder(reason);
          return res.success;
        }}
      />
    </div>
  );
});
