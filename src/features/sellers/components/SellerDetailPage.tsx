"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Banknote, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { SensitiveValue } from "@/components/SensitiveValue";
import { toast } from "@/hooks/useToast";
import { formatPKR } from "@/lib/format";
import { useOrdersStore } from "@/features/orders/orders.store";
import { ORDERS_MOCK } from "@/features/orders/orders.mock";
import {
  itemsSummary,
  suborderStatusLabelMap,
  suborderStatusToneMap,
} from "@/features/orders/orders.helpers";
import { useTiersStore } from "@/features/tiers/tiers.store";
import { formatRate, resolveCommission } from "@/features/tiers/tiers.helpers";
import { usePayoutsStore } from "@/features/payouts/payouts.store";
import {
  computeSellerEarnings,
  ibanLast4,
} from "@/features/payouts/payouts.helpers";
import { RecordTransferDialog } from "@/features/payouts/components/RecordTransferDialog";
import { brandUrl } from "@/features/settings/settings.helpers";
import { useSellersStore } from "../sellers.store";
import {
  getDocumentLabel,
  kybDocumentStatusLabelMap,
  kybDocumentStatusToneMap,
  sellerStatusLabelMap,
  sellerStatusToneMap,
  sellerTierLabelMap,
} from "../sellers.helpers";
import { env } from "@/core/env/env";

/** Used only if no commission rule is live (shouldn't happen once tiers are set up). */
const FALLBACK_RATE_BPS = 1500;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function SellerDetailPage({ sellerId }: { sellerId: string }) {
  const { selectedSeller: seller, fetchSellerById, loading } = useSellersStore();
  const { allOrders, fetchOrders } = useOrdersStore();
  const { commissionRules, fetchTiers } = useTiersStore();
  const { payouts, saving, fetchPayouts, recordTransfer } = usePayoutsStore();
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    fetchSellerById(sellerId);
    // fetchTiers();
    // fetchPayouts();
    // if (!useOrdersStore.getState().allOrders.length) fetchOrders();
  }, [sellerId, fetchSellerById, 
    // fetchTiers, fetchPayouts, fetchOrders
  ]);

  const orders = allOrders.length ? allOrders : ORDERS_MOCK;

  const rateBps = useMemo(
    () =>
      resolveCommission(commissionRules, [], sellerId, null)?.rateBps ??
      FALLBACK_RATE_BPS,
    [commissionRules, sellerId]
  );
  const earnings = useMemo(
    () => computeSellerEarnings(sellerId, orders, payouts, rateBps),
    [sellerId, orders, payouts, rateBps]
  );
  const sellerOrders = useMemo(
    () =>
      orders.flatMap((o) =>
        o.suborders
          .filter((s) => s.sellerId === sellerId)
          .map((s) => ({ order: o, parcel: s }))
      ),
    [orders, sellerId]
  );
  const history = payouts.filter((p) => p.sellerId === sellerId);

  if (!seller) {
    return (
      <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
        {loading ? "Loading..." : "Seller not found."}{" "}
        <Link href="/sellers" className="text-primary hover:underline">
          Back to sellers
        </Link>
      </Card>
    );
  }

  const bank = seller.bankAccount;
  const titleMismatch =
    bank &&
    seller.legalName &&
    !seller.legalName.startsWith("[") &&
    bank.accountTitle.trim().toLowerCase() !==
      seller.legalName.trim().toLowerCase();
  const target = `Seller ${seller.name}`;
  const canTransfer =
    !!bank && earnings.balance > 0 && seller.status !== "SUSPENDED";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-4">
          {seller.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.logoUrl}
              alt=""
              className="h-14 w-14 rounded-2xl border object-cover"
            />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent text-xl font-semibold text-primary">
              {seller.name.slice(0, 1)}
            </span>
          )}
          <div>
            <Link
              href="/sellers"
              className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Sellers
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{seller.name}</h1>
              <StatusBadge tone={sellerStatusToneMap[seller.status]}>
                {sellerStatusLabelMap[seller.status]}
              </StatusBadge>
              <StatusBadge tone="neutral">
                {sellerTierLabelMap[seller.tier]}
              </StatusBadge>
            </div>
            <p className="text-[13px] text-muted-foreground">
              {seller.legalName} · joined {formatDate(seller.createdAt)} ·{" "}
              <Link
                href={`/products?seller=${seller.id}`}
                className="text-primary hover:underline"
              >
                {seller.productCount} products
              </Link>
            </p>
          </div>
        </div>
        {seller.status === "APPROVED" && (
          <Button
            asChild
            variant="secondary"
            className="min-h-11 cursor-pointer rounded-[10px]"
          >
            <a
              href={`https://www.aariee.com${brandUrl(seller)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink /> Storefront page
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Payout summary */}
          <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[15px] font-semibold">Payouts</h2>
                <p className="text-[13px] text-muted-foreground">
                  Delivered parcels only · commission {formatRate(rateBps)} on
                  item value · shipping is not included
                </p>
              </div>
              <Button
                disabled={!canTransfer}
                title={
                  !bank
                    ? "No bank account on file"
                    : earnings.balance <= 0
                      ? "Nothing owed right now"
                      : undefined
                }
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() => setTransferOpen(true)}
              >
                <Banknote /> Record transfer
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Delivered sales", value: earnings.gross },
                {
                  label: `Commission (${formatRate(rateBps)})`,
                  value: -earnings.commission,
                },
                { label: "Paid so far", value: earnings.paid },
                {
                  label: "To transfer now",
                  value: earnings.balance,
                  strong: true,
                },
              ].map((t) => (
                <div
                  key={t.label}
                  className={
                    t.strong
                      ? "rounded-xl border-2 border-primary/40 bg-accent/60 p-3"
                      : "rounded-xl border p-3"
                  }
                >
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                  <p
                    className={
                      t.strong
                        ? "text-xl font-semibold text-primary"
                        : "text-lg font-semibold"
                    }
                  >
                    {t.value < 0
                      ? `− ${formatPKR(-t.value)}`
                      : formatPKR(t.value)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[13px] text-muted-foreground">
              {formatPKR(earnings.inProgress)} more is in parcels not delivered
              yet; it becomes payable on delivery. Withholding tax is not
              deducted here yet.
            </p>
          </Card>

          {/* Orders */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <h2 className="mb-3 text-[15px] font-semibold">
              Orders ({sellerOrders.length})
            </h2>
            {sellerOrders.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Item value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerOrders.slice(0, 15).map(({ order, parcel }) => (
                    <TableRow key={parcel.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(order.placedAt)}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {itemsSummary(parcel)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatPKR(parcel.subtotal)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          tone={suborderStatusToneMap[parcel.status]}
                        >
                          {suborderStatusLabelMap[parcel.status]}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="cursor-pointer rounded-[10px]"
                        >
                          <Link href={`/orders?order=${order.orderNumber}`}>
                            Open
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {sellerOrders.length > 15 && (
              <p className="mt-2 text-[13px] text-muted-foreground">
                Showing the latest 15 of {sellerOrders.length}.
              </p>
            )}
          </Card>

          {/* Payout history */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <h2 className="mb-3 text-[15px] font-semibold">Transfers made</h2>
            {history.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No transfers recorded yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>To account</TableHead>
                    <TableHead>Recorded by</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(p.paidAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatPKR(p.amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.reference}
                        {p.note && (
                          <p className="text-xs text-muted-foreground">
                            {p.note}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap tabular-nums">
                        •••• {p.ibanLast4}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.recordedBy}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Contact & identity */}
          <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
            <h2 className="text-[15px] font-semibold">
              Contact &amp; identity
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="min-w-0">
                <SensitiveValue
                  value={seller.contactEmail || "—"}
                  kind="email"
                  label="seller email"
                  target={target}
                />
              </dd>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="min-w-0">
                <SensitiveValue
                  value={seller.contactPhone || "—"}
                  kind="phone"
                  label="seller phone"
                  target={target}
                />
              </dd>
              <dt className="text-muted-foreground">CNIC / SSN</dt>
              <dd className="min-w-0">
                <SensitiveValue
                  value={seller.idNumber || "—"}
                  kind="id"
                  label="CNIC / SSN"
                  target={target}
                />
              </dd>
              <dt className="text-muted-foreground">NTN</dt>
              <dd className="min-w-0">
                <SensitiveValue
                  value={seller.ntnNumber || "—"}
                  kind="id"
                  label="NTN"
                  target={target}
                />
              </dd>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{seller.businessAddress || "—"}</dd>
            </dl>
          </Card>

          {/* Bank account */}
          <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
            <h2 className="text-[15px] font-semibold">
              Bank account for payouts
            </h2>
            {bank ? (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd>{bank.bankName}</dd>
                  <dt className="text-muted-foreground">Account title</dt>
                  <dd>{bank.accountTitle}</dd>
                  <dt className="text-muted-foreground">IBAN</dt>
                  <dd className="min-w-0">
                    <SensitiveValue
                      value={bank.iban}
                      kind="account"
                      label="IBAN"
                      target={target}
                    />
                  </dd>
                </dl>
                {titleMismatch && (
                  <p className="flex items-start gap-2 rounded-lg bg-[#FFF3D6] p-2.5 text-xs text-[#8A5A00]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Account title doesn&apos;t match the legal name. Check the
                    bank proof before transferring.
                  </p>
                )}
              </>
            ) : (
              <p className="flex items-start gap-2 text-[13px] text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                No bank account on file. Ask the seller to add one in the seller
                portal; payouts are blocked until then.
              </p>
            )}
            {bank &&
              ibanLast4(bank.iban) &&
              history.some((p) => p.ibanLast4 !== ibanLast4(bank.iban)) && (
                <p className="text-xs text-[#8A5A00]">
                  The bank account changed after an earlier transfer.
                </p>
              )}
          </Card>

          {/* Documents */}
          <Card className="flex flex-col gap-2 rounded-2xl p-[18px] shadow-none">
            <h2 className="text-[15px] font-semibold">KYB documents</h2>
            {seller.documents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No documents uploaded yet.
              </p>
            ) : (
              seller.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 text-[13px]"
                >
                  <span className="min-w-0 truncate">
                    {getDocumentLabel(doc)}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone={kybDocumentStatusToneMap[doc.status]}>
                      {kybDocumentStatusLabelMap[doc.status]}
                    </StatusBadge>
                    {doc.url && (
                      <a
href={`${env.NEXT_PUBLIC_MEDIA_BASE_URL}${doc.url}`}                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>

                    )}
                  </span>

                  
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {bank && (
        <RecordTransferDialog
          open={transferOpen}
          sellerName={seller.name}
          bank={bank}
          balance={earnings.balance}
          saving={saving}
          onClose={() => setTransferOpen(false)}
          onSubmit={async (dto) => {
            const res = await recordTransfer(
              { sellerId: seller.id, ...dto },
              {
                balance: earnings.balance,
                ibanLast4: ibanLast4(bank.iban),
                sellerName: seller.name,
              }
            );
            toast(
              res.success
                ? { title: res.message }
                : {
                    variant: "destructive",
                    title: "Not recorded",
                    description: res.message,
                  }
            );
            return res.success;
          }}
        />
      )}
    </div>
  );
}