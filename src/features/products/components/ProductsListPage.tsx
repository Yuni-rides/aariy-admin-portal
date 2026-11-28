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
import { downloadCsv } from "@/lib/format";
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
import { SELLERS_MOCK } from "@/features/dashboard/dashboard.mock";

const ALL = "ALL";
const PAGE_SIZE = 10;

const actionBtn =
  "inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border-0 bg-[#FBEDE6] px-4 text-sm font-semibold text-[#1F1A17] no-underline hover:bg-[#F6DDD0]";

export default function ProductsListPage() {
  const {
    products,
    allProducts,
    total,
    limit,
    loading,
    fetchProducts,
  } = useProductsStore();
  // const { allSellers, fetchSellers } = useSellersStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { sellers: storeSellers, fetchSellers } = useSellersStore();
  const [tab, setTab] = useState<ProductStatus | typeof ALL>("SUBMITTED");
  const [search, setSearch] = useState("");
  const [sellerId, setSellerId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [page, setPage] = useState(1);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [tab, search, sellerId, categoryId]);

  // useEffect(() => {
  //   fetchSellers();
  //   fetchCategories();
  // }, [fetchSellers, fetchCategories]);

  const allSellers = useMemo(
    () => (storeSellers.length ? storeSellers : SELLERS_MOCK),
    [storeSellers],
  );

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

  const rejectedNotes = products.filter(
    (p) => p.status === "REJECTED" && p.rejectionReason,
  );
  const submittedCount = allProducts.filter(
    (p) => p.status === "SUBMITTED",
  ).length;

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
      ...getLeafCategories(categories).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [categories],
  );


  const handleExport = () => {
    downloadCsv(
      "aariy-products.csv",
      [
        "Product",
        "Seller",
        "Category",
        "Price (PKR)",
        "Added by",
        "Status",
        "SKUs",
      ],
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
          <Label
            htmlFor="product-search"
            className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
          >
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
        <FilterSelect
          label="Seller"
          value={sellerId}
          options={sellerOptions}
          onChange={setSellerId}
        />
        <FilterSelect
          label="Category"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
        />
      </div>

      <Card className="rounded-2xl border-[#EADFD8] px-6 pb-5 pt-4 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#EADFD8] text-sm text-[#6B5E57]">
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Product
                </th>
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Category
                </th>
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Variants
                </th>
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Stock
                </th>
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Added by
                </th>
                <th scope="col" className="px-2.5 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-2.5 py-3 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-base text-[#1F1A17]">
              {loading && products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-[#6B5E57]"
                  >
                    Loading...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-[#6B5E57]"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const stock = product.variants.reduce(
                    (sum, v) => sum + (v.stock || 0),
                    0,
                  );
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-[#EADFD8] last:border-b-0"
                    >
                      <td className="px-2.5 py-4 font-semibold">
                        {product.name}
                      </td>
                      <td className="px-2.5 py-4">{product.categoryName}</td>
                      <td className="px-2.5 py-4 tabular-nums">
                        {product.variants.length}
                      </td>
                      <td className="px-2.5 py-4 tabular-nums">{stock}</td>
                      <td className="px-2.5 py-4">
                        {product.addedBy === "STAFF"
                          ? "Aariy staff"
                          : product.sellerName}
                      </td>
                      <td className="px-2.5 py-4">
                        <StatusBadge
                          tone={productStatusToneMap[product.status]}
                        >
                          {productStatusLabelMap[product.status]}
                        </StatusBadge>
                      </td>
                      <td className="px-2.5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/products/${product.id}/edit`}
                            className={actionBtn}
                          >
                            Edit
                          </Link>
                          <Link
                            href={`/products/${product.id}`}
                            className={actionBtn}
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {(rejectedNotes.length > 0 ||
          products.some((p) => p.status === "APPROVED")) && (
          <div className="mt-4 flex flex-col gap-1 text-sm text-[#6B5E57]">
            {rejectedNotes.map((p) => (
              <p key={p.id} className="m-0">
                {p.name} rejected: &ldquo;{p.rejectionReason}&rdquo; Fix it and
                submit again.
              </p>
            ))}
            <p className="m-0">
              Approved products can be edited, but public changes are reviewed
              again.
            </p>
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          limit={limit}
          onPageChange={setPage}
        />
      </Card>

    </div>
  );
}
