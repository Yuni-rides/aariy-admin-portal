"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Pagination } from "@/components/ui/Pagination";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/hooks/useToast";
import { downloadCsv, formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOrdersStore } from "../orders.store";
import { OrderTab } from "../orders.types";
import {
  ORDER_TABS,
  callButtonLabel,
  formatOrderTime,
  orderStatusLabelMap,
  orderStatusToneMap,
  parcelSummary,
} from "../orders.helpers";
import { OrderDetail } from "./OrderDetail";

const PAGE_SIZE = 10;

type Result = { success: boolean; message: string };

export default function OrdersPage() {
  const {
    orders,
    allOrders,
    total,
    limit,
    loading,
    saving,
    fetchOrders,
    logCall,
    cancelOrder,
    cancelSuborder,
  } = useOrdersStore();

  // Deep link from the dashboard: /orders?order=ARY-1042 opens that order.
  const linkedOrder = useSearchParams().get("order");

  const [tab, setTab] = useState<OrderTab>(linkedOrder ? "ALL" : "PENDING_CONFIRMATION");
  const [search, setSearch] = useState(linkedOrder ?? "");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(linkedOrder);
  const callLogRef = useRef<HTMLDivElement>(null);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchOrders(page, PAGE_SIZE, { tab }, search), 250);
    return () => clearTimeout(t);
  }, [page, tab, search, fetchOrders]);

  // Keep the detail on a row that is visible in the current view.
  useEffect(() => {
    if (!orders.some((o) => o.id === selectedId)) {
      setSelectedId(orders[0]?.id ?? null);
    }
  }, [orders, selectedId]);

  const selected = allOrders.find((o) => o.id === selectedId);
  const pendingCount = allOrders.filter((o) => o.status === "PENDING_CONFIRMATION").length;

  const notify = (res: Result) => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res;
  };

  const startCall = (id: string) => {
    setSelectedId(id);
    // Bring the call log into view so the outcome buttons are at hand.
    requestAnimationFrame(() =>
      callLogRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  const handleExport = () => {
    downloadCsv(
      "aariy-orders.csv",
      ["Order", "Placed", "Buyer", "Phone", "City", "Payment", "Parcels", "Total (PKR)", "Status"],
      orders.map((o) => [
        o.orderNumber,
        formatOrderTime(o.placedAt),
        o.buyerName,
        o.contactPhone,
        o.address.city,
        o.paymentMethod,
        o.suborders.length,
        o.total,
        orderStatusLabelMap[o.status],
      ]),
    );
  };

  const listTitle = ORDER_TABS.find((t) => t.value === tab)?.label ?? "Orders";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Button
          variant="secondary"
          className="min-h-11 cursor-pointer rounded-[10px]"
          onClick={handleExport}
          disabled={orders.length === 0}
        >
          <Download /> Export CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {ORDER_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "min-h-11 cursor-pointer rounded-[10px] border px-3.5 text-sm font-medium",
              tab === t.value
                ? "border-foreground bg-foreground text-white"
                : "border-input bg-white hover:bg-muted",
            )}
          >
            {t.label}
            {t.value === "PENDING_CONFIRMATION" ? ` · ${pendingCount}` : ""}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* List */}
        <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
          <h2 className="text-[15px] font-semibold">{listTitle}</h2>
          <div>
            <Label htmlFor="order-search" className="sr-only">
              Search orders
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="order-search"
                className="h-11 rounded-[10px] bg-white pl-9"
                placeholder="Order no, buyer or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No orders in this view</p>
          ) : (
            <ul className="flex flex-col">
              {orders.map((o) => {
                const active = o.id === selectedId;
                return (
                  <li key={o.id} className="border-t first:border-t-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-3",
                        active ? "bg-accent" : "hover:bg-muted",
                      )}
                      onClick={() => setSelectedId(o.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(o.id);
                        }
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{o.orderNumber}</p>
                        <p className="truncate text-[13px] text-muted-foreground">
                          {parcelSummary(o)} · {formatPKR(o.total)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {o.buyerName} · {formatOrderTime(o.placedAt)}
                        </p>
                      </div>
                      {o.status === "PENDING_CONFIRMATION" ? (
                        <Button
                          size="sm"
                          variant={o.calls.length ? "secondary" : "default"}
                          className="min-h-9 shrink-0 cursor-pointer rounded-[10px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(o.id);
                          }}
                        >
                          {callButtonLabel(o)}
                        </Button>
                      ) : (
                        <StatusBadge tone={orderStatusToneMap[o.status]} className="shrink-0">
                          {orderStatusLabelMap[o.status]}
                        </StatusBadge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </Card>

        {/* Detail */}
        {selected ? (
          <OrderDetail
            ref={callLogRef}
            order={selected}
            saving={saving}
            onLogCall={async (outcome, note) => notify(await logCall(selected.id, outcome, note))}
            onCancelOrder={async (reason) => notify(await cancelOrder(selected.id, reason))}
            onCancelSuborder={async (suborderId, reason) =>
              notify(await cancelSuborder(selected.id, suborderId, reason))
            }
          />
        ) : (
          <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
            Select an order to see its parcels and call log.
          </Card>
        )}
      </div>
    </div>
  );
}
