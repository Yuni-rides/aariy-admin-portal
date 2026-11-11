"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Pagination } from "@/components/ui/Pagination";
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
import { cn } from "@/lib/utils";
import { useSellersStore } from "@/features/sellers/sellers.store";
import { useCategoriesStore } from "@/features/categories/categories.store";
import { getLeafCategories } from "@/features/categories/categories.helpers";
import { useProductsStore } from "../products.store";
import { ProductStatus } from "../products.types";
import {
  PRODUCT_TABS,
  getProductPrice,
  productStatusLabelMap,
  productStatusToneMap,
} from "../products.helpers";
import { ProductReviewPanel } from "./ProductReviewPanel";

const ALL = "ALL";
const PAGE_SIZE = 10;

export default function ProductsListPage() {
  const {
    products,
    allProducts,
    total,
    limit,
    loading,
    saving,
    fetchProducts,
    approveProduct,
    rejectProduct,
  } = useProductsStore();
  const { allSellers, fetchSellers } = useSellersStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [tab, setTab] = useState<ProductStatus | typeof ALL>("SUBMITTED");
  const [search, setSearch] = useState("");
  const [sellerId, setSellerId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [tab, search, sellerId, categoryId]);

  useEffect(() => {
    fetchSellers();
    fetchCategories();
  }, [fetchSellers, fetchCategories]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts(
        page,
        PAGE_SIZE,
        {
          status: tab === ALL ? undefined : tab,
          sellerId: sellerId === ALL ? undefined : sellerId,
          categoryId: categoryId === ALL ? undefined : categoryId,
        },
        search,
      );
    }, 250);
    return () => clearTimeout(t);
  }, [page, tab, search, sellerId, categoryId, fetchProducts]);

  // Keep the side panel on a row that is visible in the current view.
  useEffect(() => {
    if (!products.some((p) => p.id === selectedId)) {
      setSelectedId(products[0]?.id ?? null);
    }
  }, [products, selectedId]);

  const selected = allProducts.find((p) => p.id === selectedId);
  const submittedCount = allProducts.filter((p) => p.status === "SUBMITTED").length;

  const sellerOptions = useMemo(
    () => [
      { value: ALL, label: "All" },
      ...allSellers.map((b) => ({ value: b.id, label: b.name })),
    ],
    [allSellers],
  );
  const categoryOptions = useMemo(
    () => [
      { value: ALL, label: "All" },
      ...getLeafCategories(categories).map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const notify = (res: { success: boolean; message: string }) =>
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );

  const handleExport = () => {
    downloadCsv(
      "aariy-products.csv",
      ["Product", "Seller", "Category", "Price (PKR)", "Added by", "Status", "SKUs"],
      products.map((p) => [
        p.name,
        p.sellerName,
        p.categoryName,
        getProductPrice(p),
        p.addedBy === "STAFF" ? "Aariy staff" : "Seller",
        productStatusLabelMap[p.status],
        p.variants.map((v) => v.sku).join(" "),
      ]),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={handleExport}
            disabled={products.length === 0}
          >
            <Download /> Export CSV
          </Button>
          <Button asChild className="min-h-11 cursor-pointer rounded-[10px]">
            <Link href="/products/new">
              <Plus /> Add product
            </Link>
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {PRODUCT_TABS.map((t) => (
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
            {t.value === "SUBMITTED" ? ` · ${submittedCount}` : ""}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="product-search" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="product-search"
              className="h-11 rounded-[10px] bg-white pl-9"
              placeholder="Product name or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <FilterSelect label="Seller" value={sellerId} options={sellerOptions} onChange={setSellerId} />
        <FilterSelect
          label="Category"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-[18px] shadow-none lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Added by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">Loading...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center">No products found</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow
                    key={product.id}
                    className={cn("cursor-pointer", product.id === selectedId && "bg-accent/50")}
                    onClick={() => setSelectedId(product.id)}
                  >
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sellerName}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatPKR(getProductPrice(product))}
                    </TableCell>
                    <TableCell>
                      {product.addedBy === "STAFF" ? (
                        <StatusBadge tone="info">Aariy staff</StatusBadge>
                      ) : (
                        "Seller"
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={productStatusToneMap[product.status]}>
                        {productStatusLabelMap[product.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={product.status === "SUBMITTED" ? "default" : "secondary"}
                        size="sm"
                        className="cursor-pointer rounded-[10px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(product.id);
                        }}
                      >
                        {product.status === "SUBMITTED" ? "Review" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
          />
        </Card>

        {selected ? (
          <ProductReviewPanel
            product={selected}
            saving={saving}
            onApprove={async () => notify(await approveProduct(selected.id))}
            onReject={async (reason) => {
              const res = await rejectProduct(selected.id, reason);
              notify(res);
              return res.success;
            }}
          />
        ) : (
          <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
            Nothing to review in this view.
          </Card>
        )}
      </div>
    </div>
  );
}
