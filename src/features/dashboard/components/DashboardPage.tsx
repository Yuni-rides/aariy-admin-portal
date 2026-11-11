"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { toast } from "@/hooks/useToast";
import { downloadCsv, formatPKR } from "@/lib/format";
import { useDashboardStore } from "../dashboard.store";
import {
  STAT_CARDS,
  orderStatusLabelMap,
  orderStatusToneMap,
} from "../dashboard.helpers";

export default function DashboardPage() {
  const { data, loading, error, fetchDashboard } = useDashboardStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleExport = () => {
    if (!data) return;
    downloadCsv(
      "aariy-dashboard-report.csv",
      ["Metric", "Value"],
      STAT_CARDS.map((s) => [s.label, data.stats[s.key]]),
    );
  };

  const openOrder = (orderNumber: string) => {
    toast({
      title: orderNumber,
      description: "Order details will open here once the Orders module is ready.",
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button
          variant="secondary"
          className="min-h-11 cursor-pointer rounded-[10px]"
          onClick={handleExport}
          disabled={!data}
        >
          <Download /> Export report
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/30 p-4 text-sm text-destructive shadow-none">
          {error}
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <Card key={stat.key} className="rounded-2xl p-[18px] shadow-none">
            <div className="text-[13px] text-muted-foreground">{stat.label}</div>
            {loading || !data ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <div className="text-[28px] font-semibold">
                {data.stats[stat.key]}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="rounded-2xl p-[18px] shadow-none lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-semibold">Recent orders</h2>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Sellers</TableHead>
                <TableHead>Total (COD)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || !data ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    No recent orders
                  </TableCell>
                </TableRow>
              ) : (
                data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.sellerCount}</TableCell>
                    <TableCell>{formatPKR(order.totalCod)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={orderStatusToneMap[order.status]}>
                        {orderStatusLabelMap[order.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="cursor-pointer rounded-[10px]"
                        onClick={() => openOrder(order.orderNumber)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Needs attention */}
        <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
          <h2 className="text-[15px] font-semibold">Needs attention</h2>
          {loading || !data
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))
            : data.attention.map((item) => {
                const row = (
                  <div className="flex items-center justify-between gap-3 rounded-lg py-1 text-sm">
                    <span>{item.label}</span>
                    <StatusBadge tone={item.tone}>{item.value}</StatusBadge>
                  </div>
                );
                return item.href ? (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="hover:text-primary"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={item.key}>{row}</div>
                );
              })}
        </Card>
      </div>
    </div>
  );
}
