"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { toast } from "@/hooks/useToast";
import { useSellersStore } from "@/features/sellers/sellers.store";
import { useCategoriesStore } from "@/features/categories/categories.store";
import { CategoryPicker } from "@/features/categories/components/CategoryPicker";
import { useProductsStore } from "../products.store";
import { ProductVariant, SaveProductDto, SizeChartRow } from "../products.types";
import {
  AFTER_SAVE_OPTIONS,
  MAX_PRODUCT_IMAGES,
  newVariantId,
} from "../products.helpers";

type ProductFormPageProps = {
  /** Present when editing an existing product. */
  productId?: string;
};

type FormState = Omit<SaveProductDto, "dispatchLeadTimeDays"> & {
  dispatchLeadTimeDays: string;
};

const emptyVariant = (): ProductVariant => ({
  id: newVariantId(),
  size: "",
  colour: "",
  sku: "",
  barcode: "",
  price: 0,
  stock: 0,
});

const EMPTY: FormState = {
  name: "",
  sellerId: "",
  categoryId: "",
  description: "",
  material: "",
  dispatchLeadTimeDays: "",
  variants: [emptyVariant()],
  images: [],
  sizeChart: [],
  status: "APPROVED",
};

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";
const inputClass = "h-11 rounded-[10px] bg-white";
const cellInput = "h-9 min-w-[90px] rounded-lg bg-white";

export default function ProductFormPage({ productId }: ProductFormPageProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const { product, saving, getProductById, createProduct, updateProduct } = useProductsStore();
  const { allSellers, fetchSellers } = useSellersStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSellers();
    fetchCategories();
    if (productId) getProductById(productId);
  }, [productId, fetchSellers, fetchCategories, getProductById]);

  useEffect(() => {
    if (isEdit && product && product.id === productId) {
      setForm({
        name: product.name,
        sellerId: product.sellerId,
        categoryId: product.categoryId,
        description: product.description,
        material: product.material ?? "",
        dispatchLeadTimeDays: product.dispatchLeadTimeDays?.toString() ?? "",
        variants: product.variants,
        images: product.images.filter(Boolean),
        sizeChart: product.sizeChart,
        status: "APPROVED",
      });
      setDirty(false);
    }
  }, [isEdit, product, productId]);

  // Only approved sellers can have products added on their behalf.
  const sellerOptions = useMemo(
    () =>
      allSellers
        .filter((b) => b.status === "APPROVED" || b.id === form.sellerId)
        .map((b) => ({ value: b.id, label: b.name })),
    [allSellers, form.sellerId],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const updateVariant = (id: string, changes: Partial<ProductVariant>) =>
    update(
      "variants",
      form.variants.map((v) => (v.id === id ? { ...v, ...changes } : v)),
    );

  const updateSizeRow = (index: number, changes: Partial<SizeChartRow>) =>
    update(
      "sizeChart",
      form.sizeChart.map((r, i) => (i === index ? { ...r, ...changes } : r)),
    );

  const addImages = (files: FileList | null) => {
    if (!files) return;
    // TODO(api): upload files and keep the returned URLs.
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    update("images", [...form.images, ...urls].slice(0, MAX_PRODUCT_IMAGES));
  };

  const makeCover = (index: number) => {
    const next = [...form.images];
    const [img] = next.splice(index, 1);
    update("images", [img, ...next]);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.sellerId) next.sellerId = "Choose a seller";
    if (!form.name.trim()) next.name = "Product name is required";
    if (!form.categoryId) next.categoryId = "Choose a last-level category";
    if (!form.variants.length) next.variants = "Add at least one variant";
    else if (form.variants.some((v) => !v.size.trim() || !v.sku.trim() || v.price <= 0))
      next.variants = "Each variant needs a size, SKU and a price above 0";
    else {
      const skus = form.variants.map((v) => v.sku.trim().toLowerCase());
      if (new Set(skus).size !== skus.length) next.variants = "SKUs must be unique";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (status: SaveProductDto["status"]) => {
    if (!validate()) {
      toast({ variant: "destructive", title: "Check the highlighted fields" });
      return;
    }
    const dto: SaveProductDto = {
      ...form,
      status,
      name: form.name.trim(),
      material: form.material?.trim() || undefined,
      dispatchLeadTimeDays: form.dispatchLeadTimeDays
        ? Number(form.dispatchLeadTimeDays)
        : undefined,
    };
    const meta = {
      sellerName: allSellers.find((b) => b.id === dto.sellerId)?.name ?? "",
      categoryName: categories.find((c) => c.id === dto.categoryId)?.name ?? "",
    };
    const res = isEdit
      ? await updateProduct(productId!, dto, meta)
      : await createProduct(dto, meta);
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't save", description: res.message },
    );
    if (res.success) router.push("/products");
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="rounded-2xl p-[18px] shadow-none">
        <h2 className="mb-3 text-[15px] font-semibold">Seller</h2>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[180px] flex-1">
            <FilterSelect
              label="Add this product for seller"
              value={form.sellerId}
              options={sellerOptions}
              onChange={(v) => update("sellerId", v)}
            />
            {errors.sellerId && <p className="mt-1 text-xs text-destructive">{errors.sellerId}</p>}
          </div>
          <FilterSelect
            label="After saving"
            value={form.status}
            options={[...AFTER_SAVE_OPTIONS]}
            onChange={(v) => update("status", v as SaveProductDto["status"])}
          />
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Only approved sellers are listed. The change is written to the audit log
          as created by staff on behalf of the seller.
        </p>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Products / {isEdit ? "Edit product" : "Add product for a seller"}
          </Link>
          <h1 className="text-2xl font-semibold">{isEdit ? form.name || "Edit product" : "New product"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {dirty && <StatusBadge tone="warning">Not saved</StatusBadge>}
          <Button
            variant="secondary"
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={() => save("DRAFT")}
          >
            Save draft
          </Button>
          <Button
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={() => save(form.status)}
          >
            {form.status === "APPROVED" ? "Save & approve" : "Save for seller"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Details */}
          <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
            <h2 className="text-[15px] font-semibold">Details</h2>
            <div>
              <Label htmlFor="p-name" className={labelClass}>Product name</Label>
              <Input id="p-name" className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <CategoryPicker
                id="p-category"
                label="Category (last level only)"
                categories={categories}
                value={form.categoryId}
                onChange={(v) => update("categoryId", v)}
                error={errors.categoryId}
              />
            </div>
            <div>
              <Label htmlFor="p-desc" className={labelClass}>Description</Label>
              <Textarea id="p-desc" rows={3} className="rounded-[10px] bg-white" value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="p-material" className={labelClass}>Material</Label>
                <Input id="p-material" className={inputClass} value={form.material} onChange={(e) => update("material", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p-lead" className={labelClass}>Dispatch lead time (days)</Label>
                <Input id="p-lead" type="number" min={0} className={inputClass} value={form.dispatchLeadTimeDays} onChange={(e) => update("dispatchLeadTimeDays", e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Variants */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">Variants</h2>
              <StatusBadge tone="info">Stock entered manually</StatusBadge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Size</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Price (PKR)</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.variants.map((v) => (
                  <TableRow key={v.id} className="hover:bg-transparent">
                    <TableCell><Input aria-label="Size" className={cellInput} value={v.size} onChange={(e) => updateVariant(v.id, { size: e.target.value })} /></TableCell>
                    <TableCell><Input aria-label="Colour" className={cellInput} value={v.colour} onChange={(e) => updateVariant(v.id, { colour: e.target.value })} /></TableCell>
                    <TableCell><Input aria-label="SKU" className={cellInput} value={v.sku} onChange={(e) => updateVariant(v.id, { sku: e.target.value })} /></TableCell>
                    <TableCell><Input aria-label="Barcode" className={cellInput} value={v.barcode} onChange={(e) => updateVariant(v.id, { barcode: e.target.value })} /></TableCell>
                    <TableCell><Input aria-label="Price" type="number" min={0} className={cellInput} value={v.price || ""} onChange={(e) => updateVariant(v.id, { price: Number(e.target.value) })} /></TableCell>
                    <TableCell><Input aria-label="Stock" type="number" min={0} className={cellInput} value={v.stock} onChange={(e) => updateVariant(v.id, { stock: Number(e.target.value) })} /></TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove variant"
                        className="cursor-pointer text-destructive"
                        disabled={form.variants.length === 1}
                        onClick={() => update("variants", form.variants.filter((x) => x.id !== v.id))}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.variants && <p className="mt-2 text-xs text-destructive">{errors.variants}</p>}
            <Button
              type="button"
              variant="secondary"
              className="mt-3 min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => update("variants", [...form.variants, emptyVariant()])}
            >
              <Plus /> Add variant
            </Button>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {/* Images */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <h2 className="mb-3 text-[15px] font-semibold">Images</h2>
            <div className="flex flex-wrap gap-3">
              {form.images.map((src, i) => (
                <div key={src + i} className="group relative">
                  <button
                    type="button"
                    title={i === 0 ? "Cover image" : "Make cover"}
                    className="block cursor-pointer"
                    onClick={() => makeCover(i)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className={`h-[72px] w-[72px] rounded-xl object-cover ${i === 0 ? "ring-2 ring-primary" : ""}`}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove image"
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 cursor-pointer place-items-center rounded-full bg-foreground text-white"
                    onClick={() => update("images", form.images.filter((_, j) => j !== i))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {form.images.length < MAX_PRODUCT_IMAGES && (
                <button
                  type="button"
                  aria-label="Add images"
                  className="grid h-[72px] w-[72px] cursor-pointer place-items-center rounded-xl border border-dashed border-[#D9805B] bg-accent text-[#D9805B]"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              First image is the cover. Click an image to make it the cover.
            </p>
          </Card>

          {/* Size chart */}
          <Card className="rounded-2xl p-[18px] shadow-none">
            <h2 className="mb-3 text-[15px] font-semibold">Size chart (cm)</h2>
            {form.sizeChart.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Size</TableHead>
                    <TableHead>Chest</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead className="w-0" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.sizeChart.map((row, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell><Input aria-label="Size" className="h-9 min-w-[50px] rounded-lg bg-white" value={row.size} onChange={(e) => updateSizeRow(i, { size: e.target.value })} /></TableCell>
                      <TableCell><Input aria-label="Chest" className="h-9 min-w-[50px] rounded-lg bg-white" value={row.chest} onChange={(e) => updateSizeRow(i, { chest: e.target.value })} /></TableCell>
                      <TableCell><Input aria-label="Length" className="h-9 min-w-[50px] rounded-lg bg-white" value={row.length} onChange={(e) => updateSizeRow(i, { length: e.target.value })} /></TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Remove row"
                          className="cursor-pointer text-destructive"
                          onClick={() => update("sizeChart", form.sizeChart.filter((_, j) => j !== i))}
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() => update("sizeChart", [...form.sizeChart, { size: "", chest: "", length: "" }])}
              >
                <Plus /> Add row
              </Button>
              {form.sizeChart.length === 0 && form.variants.some((v) => v.size) && (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 cursor-pointer rounded-[10px]"
                  onClick={() =>
                    update(
                      "sizeChart",
                      Array.from(new Set(form.variants.map((v) => v.size).filter(Boolean))).map(
                        (size) => ({ size, chest: "", length: "" }),
                      ),
                    )
                  }
                >
                  Use variant sizes
                </Button>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl p-[18px] shadow-none">
            <h2 className="mb-2 text-[15px] font-semibold">Approval</h2>
            <p className="text-[13px] text-muted-foreground">
              Super admin can approve directly. No review step. The seller gets an
              email and sees &ldquo;Added by Aariy staff&rdquo;.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
