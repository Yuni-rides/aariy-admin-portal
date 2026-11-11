"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import { cn } from "@/lib/utils";
import { useSellersStore } from "../sellers.store";
import { SellerReviewAction, SellerStatus, SellerTier, CreateSellerDto } from "../sellers.types";
import {
  SELLER_STATUS_OPTIONS,
  SELLER_TIER_OPTIONS,
  sellerStatusLabelMap,
  sellerStatusToneMap,
  sellerTierLabelMap,
  needsReview,
} from "../sellers.helpers";
import { SellerReviewPanel } from "./SellerReviewPanel";
import { AddSellerModal } from "./AddSellerModal";

export default function SellersListPage() {
  const { sellers, allSellers, loading, saving, fetchSellers, createSeller, reviewSeller } =
    useSellersStore();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SellerStatus | "ALL">("ALL");
  const [tier, setTier] = useState<SellerTier | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSellers(
        {
          status: status === "ALL" ? undefined : status,
          tier: tier === "ALL" ? undefined : tier,
        },
        search,
      );
    }, 250);
    return () => clearTimeout(t);
  }, [search, status, tier, fetchSellers]);

  // Default the side panel to the first seller waiting for review.
  useEffect(() => {
    if (!selectedId && allSellers.length) {
      setSelectedId((allSellers.find((b) => needsReview(b.status)) ?? allSellers[0]).id);
    }
  }, [allSellers, selectedId]);

  const selected = allSellers.find((b) => b.id === selectedId);

  const handleAction = async (action: SellerReviewAction, note: string) => {
    if (!selected) return false;
    const res = await reviewSeller(selected.id, action, note);
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res.success;
  };

  const handleCreate = async (dto: CreateSellerDto) => {
    const res = await createSeller(dto);
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't add seller", description: res.message },
    );
    if (res.success && res.id) setSelectedId(res.id);
    return res.success;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Sellers</h1>
        <Button className="min-h-11 cursor-pointer rounded-[10px]" onClick={() => setAddOpen(true)}>
          <Plus /> Add seller
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="seller-search" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="seller-search"
              className="h-11 rounded-[10px] bg-white pl-9"
              placeholder="Seller or legal name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <FilterSelect
          label="Status"
          value={status}
          options={SELLER_STATUS_OPTIONS}
          onChange={(v) => setStatus(v as SellerStatus | "ALL")}
        />
        <FilterSelect
          label="Tier"
          value={tier}
          options={SELLER_TIER_OPTIONS}
          onChange={(v) => setTier(v as SellerTier | "ALL")}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-[18px] shadow-none lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Seller</TableHead>
                <TableHead>Legal entity</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">Loading...</TableCell>
                </TableRow>
              ) : sellers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">No sellers found</TableCell>
                </TableRow>
              ) : (
                sellers.map((seller) => (
                  <TableRow
                    key={seller.id}
                    className={cn("cursor-pointer", seller.id === selectedId && "bg-accent/50")}
                    onClick={() => setSelectedId(seller.id)}
                  >
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.legalName}</TableCell>
                    <TableCell>{seller.productCount}</TableCell>
                    <TableCell>{sellerTierLabelMap[seller.tier]}</TableCell>
                    <TableCell>
                      <StatusBadge tone={sellerStatusToneMap[seller.status]}>
                        {sellerStatusLabelMap[seller.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={needsReview(seller.status) ? "default" : "secondary"}
                        size="sm"
                        className="cursor-pointer rounded-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(seller.id);
                        }}
                      >
                        {needsReview(seller.status) ? "Review" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {selected ? (
          <SellerReviewPanel seller={selected} saving={saving} onAction={handleAction} />
        ) : (
          <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
            Select a seller to see its KYB documents.
          </Card>
        )}
      </div>

      <AddSellerModal
        open={addOpen}
        saving={saving}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
