"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { mediaApi } from "@/shared/api/media.api";
import { AUTH_BYPASS } from "@/features/auth/auth.mock";
import { useSellersStore } from "@/features/sellers/sellers.store";
import type { Seller } from "@/features/sellers/sellers.types";
import { SELLERS_MOCK } from "@/features/dashboard/dashboard.mock";
import { useCategoriesStore } from "@/features/categories/categories.store";
import { categoryApi } from "@/features/categories/categories.api";
import type { CategoryField } from "@/features/categories/categories.types";
import { findCategoryRecursive } from "@/features/categories/categories.helpers";
import { CategoryPicker } from "@/features/categories/components/CategoryPicker";
import { useSizeChartsStore } from "@/features/sizeCharts/sizeCharts.store";
import { SizeChartDialog } from "@/features/sizeCharts/components/SizeChartDialog";
import { useProductsStore } from "../products.store";
import type { AttributeValue, SaveProductDto } from "../products.types";
import {
  MAX_DISPATCH_DAYS,
  MAX_VARIANTS,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  MIN_PUBLISH_IMAGES,
  SKU_PATTERN,
  defaultMetaDescription,
  defaultMetaTitle,
  newVariantId,
  productSlug,
} from "../products.helpers";
import { SeoPreview } from "./SeoPreview";
import { ProductAttributesCard } from "./ProductAttributesCard";
import { FormImage, ProductPhotosCard } from "./ProductPhotosCard";
import { FieldError, FieldHint, FieldLabel, FormCard, cellSelectClass, ds, selectClass } from "./ProductFormParts";

type ProductFormPageProps = {
  /** Present when editing an existing product. */
  productId?: string;
};

/** Variant row as typed in the form (numbers stay strings until saving). */
type FormVariant = {
  id: string;
  options: Record<string, string>;
  size: string;
  colour: string;
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  stock: string;
};

type FormState = {
  sellerId: string;
  name: string;
  categoryId: string;
  description: string;
  material: string;
  care: string;
  dispatchMin: string;
  dispatchMax: string;
  attributes: Record<string, AttributeValue>;
  variants: FormVariant[];
  images: FormImage[];
  sizeChartId: string;
  customs: { hsCode: string; fibreContent: string; countryOfOrigin: string; declaredValue: string };
  metaTitle: string;
  metaDescription: string;
};

const emptyVariant = (): FormVariant => ({
  id: newVariantId(),
  options: {},
  size: "",
  colour: "",
  sku: "",
  barcode: "",
  price: "",
  compareAtPrice: "",
  stock: "",
});

const EMPTY: FormState = {
  sellerId: "",
  name: "",
  categoryId: "",
  description: "",
  material: "",
  care: "",
  dispatchMin: "",
  dispatchMax: "",
  attributes: {},
  variants: [emptyVariant()],
  images: [],
  sizeChartId: "",
  customs: { hsCode: "", fibreContent: "", countryOfOrigin: "PK", declaredValue: "" },
  metaTitle: "",
  metaDescription: "",
};

const toNumber = (v: string) => (v.trim() === "" ? NaN : Number(v));
const isBlank = (v: AttributeValue | undefined) =>
  v === undefined || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "number" && Number.isNaN(v));
const brandOf = (s?: Seller) => s?.brand ?? s?.brands?.[0] ?? null;

export default function ProductFormPage({ productId }: ProductFormPageProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const { product, saving, getProductById, createProduct, updateProduct } = useProductsStore();
  const { sellers: storeSellers, fetchSellers } = useSellersStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { charts, fetchCharts, createChart, saving: savingChart } = useSizeChartsStore();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);

  useEffect(() => {
    fetchSellers({ status: "APPROVED", page: 1, limit: 100 });
    fetchCategories();
    fetchCharts();
    if (productId) getProductById(productId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Load the product being edited into the form.
  useEffect(() => {
    if (!isEdit || !product || product.id !== productId) return;
    setForm({
      sellerId: product.sellerId,
      name: product.name,
      categoryId: product.categoryId,
      description: product.description,
      material: product.material ?? "",
      care: product.care ?? "",
      dispatchMin: product.dispatchMinDays?.toString() ?? "",
      dispatchMax: product.dispatchMaxDays?.toString() ?? "",
      attributes: product.attributes ?? {},
      variants: product.variants.map((v) => ({
        id: v.id,
        options: v.options ?? {},
        size: v.size,
        colour: v.colour,
        sku: v.sku,
        barcode: v.barcode ?? "",
        price: v.price ? String(v.price) : "",
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "",
        stock: String(v.stock ?? ""),
      })),
      images: product.images.filter(Boolean).map((url, i) => ({ url, key: product.imageKeys?.[i] })),
      sizeChartId: product.sizeChartId ?? "",
      customs: {
        hsCode: product.customs?.hsCode ?? "",
        fibreContent: product.customs?.fibreContent ?? "",
        countryOfOrigin: product.customs?.countryOfOrigin ?? "PK",
        declaredValue: product.customs?.declaredValue ? String(product.customs.declaredValue) : "",
      },
      metaTitle: product.metaTitle ?? "",
      metaDescription: product.metaDescription ?? "",
    });
    setDirty(false);
  }, [isEdit, product, productId]);

  // Approved sellers only (plus the product's own seller when editing).
  const sellers = useMemo(() => {
    const list = (storeSellers.length ? storeSellers : SELLERS_MOCK).filter((s) => s.status === "APPROVED");
    return list;
  }, [storeSellers]);
  const seller = sellers.find((s) => s.id === form.sellerId);
  const sellerName = seller?.name ?? (product?.sellerId === form.sellerId ? product?.sellerName : "") ?? "";
  const brand = brandOf(seller);
  const brandName = brand?.name ?? product?.brandName ?? sellerName;
  /** Size charts belong to the brand; sellers without a brand record use the seller id. */
  const brandKey = brand?.id ?? form.sellerId;
  const brandCharts = charts.filter((c) => c.brandId === brandKey || c.id === form.sizeChartId);
  const chosenChart = charts.find((c) => c.id === form.sizeChartId);

  const category = form.categoryId ? findCategoryRecursive(categories, form.categoryId) : undefined;

  // Load the chosen category's fields (they drive Product details and the variant columns).
  useEffect(() => {
    if (!form.categoryId) {
      setFields([]);
      return;
    }
    let active = true;
    setLoadingFields(true);
    categoryApi
      .getCategoryFields(form.categoryId)
      .catch(() => findCategoryRecursive(categories, form.categoryId)?.fields ?? [])
      .then((list) => {
        if (!active) return;
        setFields(list.filter((f) => f.isActive !== false).sort((a, b) => a.sortOrder - b.sortOrder));
        setLoadingFields(false);
      });
    return () => {
      active = false;
    };
  }, [form.categoryId, categories]);

  const detailFields = fields.filter((f) => !f.isVariant);
  const variantFields = fields.filter((f) => f.isVariant);
  const hasColourField = variantFields.some((f) => /colou?r/i.test(f.code) || /colou?r/i.test(f.name));

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
    setErrors(({ [key as string]: _, ...rest }) => rest);
  };

  const updateVariant = (id: string, changes: Partial<FormVariant>) => {
    setDirty(true);
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.id === id ? { ...v, ...changes } : v)) }));
  };

  const setVariantOption = (v: FormVariant, field: CategoryField, value: string) => {
    const options = { ...v.options, [field.code]: value };
    // The first variant field is treated as the size for lists and search.
    const isFirst = variantFields[0]?.code === field.code;
    updateVariant(v.id, { options, ...(isFirst ? { size: value } : {}) });
  };

  const addImages = async (files: File[]) => {
    setUploading(true);
    try {
      // Upload in groups of 5 (the media API limit) and keep the order.
      const uploaded: FormImage[] = [];
      for (let i = 0; i < files.length; i += 5) {
        const batch = await mediaApi.uploadFiles(files.slice(i, i + 5), { purpose: "PRODUCT_IMAGE" });
        uploaded.push(...batch.map((m) => ({ url: m.url, key: m.key })));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    } catch (e) {
      if (AUTH_BYPASS) {
        // Test mode has no media backend: show local previews so the form can still be tried.
        setForm((f) => ({ ...f, images: [...f.images, ...files.map((file) => ({ url: URL.createObjectURL(file) }))] }));
        toast({ title: "Upload unavailable in test mode", description: "Showing local previews instead." });
      } else {
        toast({ variant: "destructive", title: "Photo upload failed", description: (e as Error).message });
      }
    } finally {
      setDirty(true);
      setUploading(false);
    }
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const priceOk = (v: FormVariant) => toNumber(v.price) > 0;
  const requiredDetailsMissing =
    !form.sellerId ||
    !form.name.trim() ||
    !form.categoryId ||
    !form.description.trim() ||
    form.dispatchMin === "" ||
    form.dispatchMax === "" ||
    detailFields.some((f) => f.isRequired && isBlank(form.attributes[f.code])) ||
    form.variants.some(
      (v) =>
        !v.sku.trim() ||
        v.stock === "" ||
        (variantFields.length
          ? variantFields.some((f) => f.isRequired !== false && !v.options[f.code]?.trim())
          : !v.size.trim()),
    );

  const checklist = [
    { label: `${MIN_PUBLISH_IMAGES} or more photos`, done: form.images.length >= MIN_PUBLISH_IMAGES },
    { label: "Size chart chosen", done: !!form.sizeChartId },
    { label: "A price on every variant", done: form.variants.length > 0 && form.variants.every(priceOk) },
    { label: "Required details filled", done: !requiredDetailsMissing },
  ];
  const readyToPublish = checklist.every((c) => c.done);

  /** Format checks apply to drafts too; "publish" adds the required-field checks. */
  const validate = (publish: boolean) => {
    const e: Record<string, string> = {};
    if (!form.sellerId) e.sellerId = "Choose a seller";
    if (!form.name.trim()) e.name = "Product name is required";

    const min = toNumber(form.dispatchMin);
    const max = toNumber(form.dispatchMax);
    const badDay = (n: number) => !Number.isInteger(n) || n < 0 || n > MAX_DISPATCH_DAYS;
    if ((form.dispatchMin !== "" && badDay(min)) || (form.dispatchMax !== "" && badDay(max)))
      e.dispatch = `Use whole days from 0 to ${MAX_DISPATCH_DAYS}`;
    else if (form.dispatchMin !== "" && form.dispatchMax !== "" && max < min) e.dispatch = `"To" can't be less than "From"`;

    if (form.variants.length > MAX_VARIANTS) e.variants = `Up to ${MAX_VARIANTS} variants`;
    const skus = form.variants.map((v) => v.sku.trim().toLowerCase()).filter(Boolean);
    if (form.variants.some((v) => v.sku.trim() && !SKU_PATTERN.test(v.sku.trim())))
      e.variants = "SKU can only use letters, digits, . - and _";
    else if (new Set(skus).size !== skus.length) e.variants = "Each SKU must be different";
    else if (form.variants.some((v) => v.price !== "" && !(toNumber(v.price) > 0))) e.variants = "Price must be above 0";
    else if (form.variants.some((v) => v.compareAtPrice !== "" && !(toNumber(v.compareAtPrice) > toNumber(v.price))))
      e.variants = "Original price must be higher than the price";
    else if (form.variants.some((v) => v.stock !== "" && !(Number.isInteger(toNumber(v.stock)) && toNumber(v.stock) >= 0)))
      e.variants = "Stock must be a whole number, 0 or more";

    if (form.customs.hsCode && !/^\d{6,10}$/.test(form.customs.hsCode.trim())) e.hsCode = "HS code is 6 to 10 digits";
    if (form.metaTitle.trim().length > META_TITLE_MAX) e.metaTitle = `Keep it to ${META_TITLE_MAX} characters`;
    if (form.metaDescription.trim().length > META_DESCRIPTION_MAX)
      e.metaDescription = `Keep it to ${META_DESCRIPTION_MAX} characters`;

    if (publish) {
      if (!form.categoryId) e.categoryId = "Choose a last-level category";
      if (!form.description.trim()) e.description = "Description is required";
      if (!e.dispatch && (form.dispatchMin === "" || form.dispatchMax === "")) e.dispatch = "Enter both days";
      for (const f of detailFields) if (f.isRequired && isBlank(form.attributes[f.code])) e[`attr:${f.code}`] = "Required";
      if (!e.variants && form.variants.length === 0) e.variants = "Add at least one variant";
      if (!e.variants && form.variants.some((v) => !priceOk(v) || !v.sku.trim() || v.stock === ""))
        e.variants = "Every variant needs a SKU, a price and stock";
      if (!e.variants && requiredDetailsMissing && form.variants.some((v) => (variantFields.length ? false : !v.size.trim())))
        e.variants = "Every variant needs a size";
      if (!e.variants && variantFields.length && form.variants.some((v) => variantFields.some((f) => !v.options[f.code])))
        e.variants = `Choose ${variantFields.map((f) => f.name.toLowerCase()).join(" and ")} for every variant`;
      if (form.images.length < MIN_PUBLISH_IMAGES) e.images = `Add at least ${MIN_PUBLISH_IMAGES} photos to publish`;
      if (!form.sizeChartId) e.sizeChartId = "Choose or create a size chart to publish";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (publish: boolean) => {
    if (!validate(publish)) {
      toast({
        variant: "destructive",
        title: publish ? "Not ready to publish" : "Check the highlighted fields",
        description: publish ? "Fix the highlighted fields, or save it as a draft." : undefined,
      });
      return;
    }
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    const customs = form.customs;
    const hasCustoms = customs.hsCode || customs.fibreContent || customs.declaredValue;
    const dto: SaveProductDto = {
      sellerId: form.sellerId,
      brandId: brand?.id ?? null,
      name: form.name.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
      material: form.material.trim() || undefined,
      care: form.care.trim() || undefined,
      dispatchMinDays: num(form.dispatchMin),
      dispatchMaxDays: num(form.dispatchMax),
      attributes: Object.fromEntries(
        Object.entries(form.attributes).filter(([code, v]) => !isBlank(v) && detailFields.some((f) => f.code === code)),
      ),
      variants: form.variants.map((v) => ({
        id: v.id,
        size: variantFields.length ? v.options[variantFields[0].code] ?? "" : v.size.trim(),
        colour: v.colour.trim(),
        options: variantFields.length ? v.options : undefined,
        sku: v.sku.trim(),
        barcode: v.barcode.trim() || undefined,
        price: toNumber(v.price) || 0,
        compareAtPrice: num(v.compareAtPrice),
        stock: toNumber(v.stock) || 0,
      })),
      images: form.images.map((i) => i.url),
      imageKeys: form.images.map((i) => i.key ?? ""),
      sizeChartId: form.sizeChartId || null,
      customs: hasCustoms
        ? {
            hsCode: customs.hsCode.trim() || undefined,
            fibreContent: customs.fibreContent.trim() || undefined,
            countryOfOrigin: customs.countryOfOrigin.trim().toUpperCase() || undefined,
            declaredValue: num(customs.declaredValue),
          }
        : null,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      status: publish ? "APPROVED" : "DRAFT",
    };
    const meta = { sellerName, categoryName: category?.name ?? product?.categoryName ?? "" };
    const res = isEdit ? await updateProduct(productId!, dto, meta) : await createProduct(dto, meta);
    toast(res.success ? { title: res.message } : { variant: "destructive", title: "Couldn't save", description: res.message });
    if (res.success) router.push("/products");
  };

  const slugPreview = isEdit && product ? product.slug : form.name.trim() ? productSlug(brandName, form.name) : "";
  const metaTitleFallback = defaultMetaTitle(form.name, brandName);
  const metaDescFallback = defaultMetaDescription(form.description);

  const stockRows = form.variants
    .map((v) => ({
      qty: Number.isInteger(toNumber(v.stock)) ? toNumber(v.stock) : 0,
      label: (variantFields.length ? v.options[variantFields[0].code] : v.size)?.trim() || "?",
    }))
    .filter((r) => r.qty > 0 || form.variants.length === 1);
  const totalStock = stockRows.reduce((t, r) => t + r.qty, 0);

  return (
    <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 text-[#1F1A17]">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Link href="/products" className="text-[13px] text-[#A9461F] no-underline hover:text-[#7E3216]">
            ← Products
          </Link>
          <h1 className="m-0 text-[26px] font-bold">{isEdit ? form.name || "Edit product" : "Add product for a seller"}</h1>
          <p className={ds.sub}>The product belongs to the seller&apos;s brand and shows in their vendor portal.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {dirty && <StatusBadge tone="warning">Not saved</StatusBadge>}
          <button type="button" disabled={saving} className={cn(ds.btn, ds.ghost)} onClick={() => save(false)}>
            Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            className={cn(ds.btn, ds.primary)}
            title={readyToPublish ? undefined : "Some items in “Before publishing” are not done yet"}
            onClick={() => save(true)}
          >
            {saving ? "Saving..." : "Save & publish"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* Main column */}
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <FormCard id="h-seller" title="Seller and brand">
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-seller" required>
                  Seller
                </FieldLabel>
                <Select
                  value={form.sellerId}
                  onValueChange={(v) => {
                    update("sellerId", v);
                    // Charts belong to a brand, so a new seller means choosing a chart again.
                    setForm((f) => ({ ...f, sizeChartId: "" }));
                  }}
                  disabled={isEdit}
                >
                  <SelectTrigger id="p-seller" className={selectClass} aria-invalid={!!errors.sellerId}>
                    <SelectValue placeholder="Choose a seller" />
                  </SelectTrigger>
                  <SelectContent>
                    {sellers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                    {isEdit && product && !sellers.some((s) => s.id === product.sellerId) && (
                      <SelectItem value={product.sellerId}>{product.sellerName}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FieldError>{errors.sellerId}</FieldError>
                <FieldHint>{isEdit ? "A product can't be moved to another seller." : "Approved, live sellers only."}</FieldHint>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel>Brand</FieldLabel>
                <div className={ds.readOnly}>
                  {brand?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.logoUrl} alt="" className="h-[26px] w-[26px] flex-none rounded-md object-cover" />
                  ) : (
                    <span aria-hidden="true" className="h-[26px] w-[26px] flex-none rounded-md bg-[#E3D4CA]" />
                  )}
                  <span className={cn("truncate font-medium", form.sellerId ? "text-[#1F1A17]" : "text-[#8A7B73]")}>
                    {form.sellerId ? brandName || "—" : "Choose a seller first"}
                  </span>
                </div>
                <FieldHint>Each seller has one brand, filled in from the chosen seller. Nothing to pick.</FieldHint>
              </div>
            </div>
          </FormCard>

          <FormCard id="h-details" title="Details">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="p-name" required>
                Product name
              </FieldLabel>
              <input id="p-name" className={ds.input} value={form.name} aria-invalid={!!errors.name} onChange={(e) => update("name", e.target.value)} />
              <FieldError>{errors.name}</FieldError>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="p-category" required>
                Category (last level)
              </FieldLabel>
              <CategoryPicker
                id="p-category"
                categories={categories}
                value={form.categoryId}
                onChange={(v) => {
                  update("categoryId", v);
                  // Fields belong to the category; start fresh.
                  setForm((f) => ({ ...f, attributes: {}, variants: f.variants.map((x) => ({ ...x, options: {} })) }));
                }}
                error={errors.categoryId}
              />
              <FieldHint>Only categories without sub-categories can be picked. Picking one loads its fields below.</FieldHint>
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="p-desc" required>
                Description
              </FieldLabel>
              <textarea
                id="p-desc"
                className={ds.textarea}
                value={form.description}
                aria-invalid={!!errors.description}
                onChange={(e) => update("description", e.target.value)}
              />
              <FieldError>{errors.description}</FieldError>
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-material">Material</FieldLabel>
                <input id="p-material" className={ds.input} value={form.material} onChange={(e) => update("material", e.target.value)} />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-care">Care instructions</FieldLabel>
                <input
                  id="p-care"
                  className={ds.input}
                  placeholder="e.g. Dry clean only"
                  value={form.care}
                  onChange={(e) => update("care", e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5" role="group" aria-labelledby="p-disp">
              <FieldLabel id="p-disp" required>
                Dispatch time (days)
              </FieldLabel>
              <div className="flex flex-wrap items-center gap-3">
                {(
                  [
                    ["dispatchMin", "From"],
                    ["dispatchMax", "To"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <label htmlFor={`p-${key}`} className="text-[13px] text-[#6B5E57]">
                      {label}
                    </label>
                    <input
                      id={`p-${key}`}
                      type="number"
                      min={0}
                      max={MAX_DISPATCH_DAYS}
                      step={1}
                      inputMode="numeric"
                      className={cn(ds.input, "w-24")}
                      value={form[key]}
                      aria-invalid={!!errors.dispatch}
                      onChange={(e) => {
                        update(key, e.target.value);
                        setErrors(({ dispatch: _, ...rest }) => rest);
                      }}
                    />
                  </div>
                ))}
              </div>
              <FieldError>{errors.dispatch}</FieldError>
              <FieldHint>0 to {MAX_DISPATCH_DAYS} days. &ldquo;To&rdquo; must not be less than &ldquo;From&rdquo;.</FieldHint>
            </div>
          </FormCard>

          {form.categoryId && (loadingFields || detailFields.length > 0) && (
            <ProductAttributesCard
              fields={detailFields}
              values={form.attributes}
              loading={loadingFields}
              errors={Object.fromEntries(
                Object.entries(errors)
                  .filter(([k]) => k.startsWith("attr:"))
                  .map(([k, v]) => [k.slice(5), v]),
              )}
              onChange={(code, value) => {
                setDirty(true);
                setForm((f) => {
                  const attributes = { ...f.attributes };
                  if (value === undefined) delete attributes[code];
                  else attributes[code] = value;
                  return { ...f, attributes };
                });
                setErrors(({ [`attr:${code}`]: _, ...rest }) => rest);
              }}
            />
          )}

          {/* Variants */}
          <FormCard
            id="h-var"
            title="Variants"
            description={
              variantFields.length
                ? `The ${variantFields.map((f) => f.name).join(" and ")} column${variantFields.length > 1 ? "s come" : " comes"} from the category.`
                : "One row for each size and colour you sell."
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse">
                <thead>
                  <tr>
                    {variantFields.length ? (
                      variantFields.map((f) => (
                        <th key={f.id} scope="col" className={thClass}>
                          {f.name}
                          {f.isRequired !== false && <span className={ds.req}> *</span>}
                        </th>
                      ))
                    ) : (
                      <th scope="col" className={thClass}>
                        Size <span className={ds.req}>*</span>
                      </th>
                    )}
                    {!hasColourField && (
                      <th scope="col" className={thClass}>
                        Colour
                      </th>
                    )}
                    <th scope="col" className={thClass}>
                      SKU <span className={ds.req}>*</span>
                    </th>
                    <th scope="col" className={thClass}>
                      Stock (pieces) <span className={ds.req}>*</span>
                    </th>
                    <th scope="col" className={thClass}>
                      Price (Rs) <span className={ds.req}>*</span>
                    </th>
                    <th scope="col" className={thClass}>
                      Original price (Rs)
                    </th>
                    <th scope="col" className={thClass}>
                      Barcode
                    </th>
                    <th scope="col" className={thClass}>
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => {
                    const row = i + 1;
                    return (
                      <tr key={v.id}>
                        {variantFields.length ? (
                          variantFields.map((f) => (
                            <td key={f.id} className={tdClass}>
                              {f.options?.length ? (
                                <Select value={v.options[f.code] ?? ""} onValueChange={(val) => setVariantOption(v, f, val)}>
                                  <SelectTrigger aria-label={`${f.name}, row ${row}`} className={cn(cellSelectClass, "min-w-[90px]")}>
                                    <SelectValue placeholder="Choose" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {f.options.map((o) => (
                                      <SelectItem key={o} value={o}>
                                        {o}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <input
                                  aria-label={`${f.name}, row ${row}`}
                                  className={cn(ds.cellInput, "min-w-[90px]")}
                                  value={v.options[f.code] ?? ""}
                                  onChange={(e) => setVariantOption(v, f, e.target.value)}
                                />
                              )}
                            </td>
                          ))
                        ) : (
                          <td className={tdClass}>
                            <input aria-label={`Size, row ${row}`} className={cn(ds.cellInput, "min-w-[80px]")} value={v.size} onChange={(e) => updateVariant(v.id, { size: e.target.value })} />
                          </td>
                        )}
                        {!hasColourField && (
                          <td className={tdClass}>
                            <input aria-label={`Colour, row ${row}`} className={cn(ds.cellInput, "min-w-[90px]")} value={v.colour} onChange={(e) => updateVariant(v.id, { colour: e.target.value })} />
                          </td>
                        )}
                        <td className={tdClass}>
                          <input aria-label={`SKU, row ${row}`} className={cn(ds.cellInput, "min-w-[120px]")} value={v.sku} onChange={(e) => updateVariant(v.id, { sku: e.target.value })} />
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`Stock, row ${row}`}
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            className={cn(ds.cellInput, "max-w-24")}
                            value={v.stock}
                            onChange={(e) => updateVariant(v.id, { stock: e.target.value })}
                          />
                        </td>
                        <td className={tdClass}>
                          <input aria-label={`Price, row ${row}`} type="number" min={1} inputMode="numeric" className={cn(ds.cellInput, "min-w-[100px]")} value={v.price} onChange={(e) => updateVariant(v.id, { price: e.target.value })} />
                        </td>
                        <td className={tdClass}>
                          <input
                            aria-label={`Original price, row ${row}`}
                            type="number"
                            min={1}
                            inputMode="numeric"
                            placeholder="Optional"
                            className={cn(ds.cellInput, "min-w-[100px]")}
                            value={v.compareAtPrice}
                            onChange={(e) => updateVariant(v.id, { compareAtPrice: e.target.value })}
                          />
                        </td>
                        <td className={tdClass}>
                          <input aria-label={`Barcode, row ${row}`} placeholder="Optional" className={cn(ds.cellInput, "min-w-[110px]")} value={v.barcode} onChange={(e) => updateVariant(v.id, { barcode: e.target.value })} />
                        </td>
                        <td className={tdClass}>
                          <button
                            type="button"
                            aria-label={`Remove row ${row}`}
                            disabled={form.variants.length === 1}
                            className="grid h-10 w-10 cursor-pointer place-items-center border-0 bg-transparent text-[#8A7B73] hover:text-[#B3261E] disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() => update("variants", form.variants.filter((x) => x.id !== v.id))}
                          >
                            <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <FieldError>{errors.variants}</FieldError>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 rounded-lg border border-[#D6E6F4] bg-[#F5F9FD] px-3.5 py-3 text-[13px] leading-normal text-[#24425E]">
              <span>
                <b className="text-[15px]">
                  Total stock: {totalStock} {totalStock === 1 ? "piece" : "pieces"}
                </b>
                {stockRows.length > 0 && totalStock > 0 && <> ({stockRows.map((r) => `${r.qty} ${r.label}`).join(" + ")})</>}
              </span>
              <span>Stock is kept per size. 0 means that size shows &ldquo;Out of stock&rdquo; on the storefront.</span>
              <span>To change stock later, use the Inventory screen; it doesn&apos;t need a review.</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={form.variants.length >= MAX_VARIANTS}
                className={cn(ds.btn, ds.soft)}
                onClick={() => update("variants", [...form.variants, emptyVariant()])}
              >
                + Add variant
              </button>
              <FieldHint>SKU: letters, digits, . - _ only, unique for this seller. Price in rupees. 1 to {MAX_VARIANTS} variants.</FieldHint>
            </div>
          </FormCard>

          {/* Customs */}
          <details className={cn(ds.card, "group gap-0")}>
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span className="flex flex-col gap-1">
                <span className="text-base font-semibold">Customs, for selling abroad</span>
                <span className={ds.sub}>Needed only before the product can ship to the US.</span>
              </span>
              <span className="text-[13px] font-semibold text-[#A9461F]">
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
              </span>
            </summary>
            <div className="grid gap-4 pt-[18px] [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-hs">HS code</FieldLabel>
                <input
                  id="p-hs"
                  inputMode="numeric"
                  placeholder="6 to 10 digits"
                  className={ds.input}
                  value={form.customs.hsCode}
                  aria-invalid={!!errors.hsCode}
                  onChange={(e) => update("customs", { ...form.customs, hsCode: e.target.value })}
                />
                <FieldError>{errors.hsCode}</FieldError>
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-fibre">Fibre content</FieldLabel>
                <input id="p-fibre" placeholder="100% silk" className={ds.input} value={form.customs.fibreContent} onChange={(e) => update("customs", { ...form.customs, fibreContent: e.target.value })} />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-origin">Country of origin</FieldLabel>
                <input
                  id="p-origin"
                  maxLength={2}
                  placeholder="PK"
                  className={cn(ds.input, "uppercase")}
                  value={form.customs.countryOfOrigin}
                  onChange={(e) => update("customs", { ...form.customs, countryOfOrigin: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1.5">
                <FieldLabel htmlFor="p-declared">Declared value (Rs)</FieldLabel>
                <input id="p-declared" type="number" min={0} inputMode="numeric" className={ds.input} value={form.customs.declaredValue} onChange={(e) => update("customs", { ...form.customs, declaredValue: e.target.value })} />
              </div>
            </div>
          </details>

          {/* SEO */}
          <FormCard
            id="h-seo"
            title="Search engine listing"
            description="How the product looks on Google and when its link is shared. Leave empty to use the product name and description."
          >
            <SeoPreview
              slug={slugPreview}
              title={form.metaTitle.trim() || metaTitleFallback}
              description={form.metaDescription.trim() || metaDescFallback}
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Product URL</FieldLabel>
              <div className={cn(ds.readOnly, "whitespace-nowrap")}>
                <span className="truncate">aariee.com/products/{slugPreview || "brand-product-name"}</span>
              </div>
              <FieldHint>Made by the server from the brand and product name when you save. It can&apos;t be typed.</FieldHint>
            </div>
            <CountedField
              id="p-meta-title"
              label="Meta title"
              max={META_TITLE_MAX}
              value={form.metaTitle}
              placeholder={metaTitleFallback || "Product name | Brand"}
              error={errors.metaTitle}
              onChange={(v) => update("metaTitle", v)}
            />
            <CountedField
              id="p-meta-description"
              label="Meta description"
              max={META_DESCRIPTION_MAX}
              multiline
              value={form.metaDescription}
              placeholder={metaDescFallback || "A short line that makes people click"}
              error={errors.metaDescription}
              hint={`Up to ${META_TITLE_MAX} characters for the title and ${META_DESCRIPTION_MAX} for the description; Google cuts longer text.`}
              onChange={(v) => update("metaDescription", v)}
            />
          </FormCard>
        </div>

        {/* Side column */}
        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-6">
          <ProductPhotosCard
            images={form.images}
            uploading={uploading}
            error={errors.images}
            onAdd={addImages}
            onChange={(images) => update("images", images)}
          />

          <FormCard id="h-sc" title="Size chart" description="Charts belong to the brand and are shared by its products. Needed to publish.">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="p-chart">Choose a chart</FieldLabel>
              <Select value={form.sizeChartId} onValueChange={(v) => update("sizeChartId", v)} disabled={!form.sellerId}>
                <SelectTrigger id="p-chart" className={selectClass} aria-invalid={!!errors.sizeChartId}>
                  <SelectValue placeholder={!form.sellerId ? "Choose a seller first" : brandCharts.length ? "Choose a chart" : "No charts yet"} />
                </SelectTrigger>
                <SelectContent>
                  {brandCharts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.unit === "CM" ? "cm" : "inch"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{errors.sizeChartId}</FieldError>
            </div>
            {chosenChart && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg bg-[#FBF8F6] text-[13px]">
                  <thead>
                    <tr>
                      {chosenChart.columns.map((c) => (
                        <th key={c} scope="col" className="whitespace-nowrap px-2.5 pb-1.5 pt-2.5 text-left text-xs font-semibold text-[#6B5E57]">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chosenChart.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((val, j) => (
                          <td key={j} className={cn("px-2.5 py-1.5", i === chosenChart.rows.length - 1 && "pb-2.5")}>
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" disabled={!form.sellerId} className={cn(ds.btn, ds.soft)} onClick={() => setChartDialogOpen(true)}>
              + New size chart
            </button>
          </FormCard>

          <FormCard id="h-check" title="Before publishing">
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className={cn("flex items-center gap-2.5", !c.done && "text-[#8C2A1B]")}>
                  {c.done ? (
                    <Check className="h-[18px] w-[18px] flex-none text-[#2E7D4F]" strokeWidth={2.2} role="img" aria-label="Done" />
                  ) : (
                    <X className="h-[18px] w-[18px] flex-none text-[#B3261E]" strokeWidth={2.2} role="img" aria-label="Missing" />
                  )}
                  {c.label}
                </li>
              ))}
            </ul>
            <FieldHint>
              Save draft works any time. Save &amp; publish puts the product live at once; the seller must be approved and the brand active.
            </FieldHint>
          </FormCard>
        </aside>
      </div>

      <SizeChartDialog
        open={chartDialogOpen}
        brandId={brandKey}
        brandName={brandName || "this brand"}
        saving={savingChart}
        onClose={() => setChartDialogOpen(false)}
        onSave={async (dto) => {
          const res = await createChart(dto);
          if (!res.success || !res.chart) return res.message;
          update("sizeChartId", res.chart.id);
          toast({ title: `${res.chart.name} saved and chosen` });
          return res.chart;
        }}
      />
    </div>
  );
}

const thClass = "whitespace-nowrap pb-2 pr-2 text-left align-bottom text-xs font-semibold text-[#6B5E57]";
const tdClass = "py-1.5 pr-2 align-middle";

type CountedFieldProps = {
  id: string;
  label: string;
  max: number;
  value: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
};

/** Text field with a live "n / max" count that turns red past the limit. */
function CountedField({ id, label, max, value, placeholder, error, hint, multiline, onChange }: CountedFieldProps) {
  const length = value.trim().length;
  const over = length > max;
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel
        htmlFor={id}
        extra={
          <span className={cn("text-xs font-normal tabular-nums", over ? "font-medium text-[#B3261E]" : "text-[#6B5E57]")}>
            {length} / {max}
          </span>
        }
      >
        {label}
      </FieldLabel>
      {multiline ? (
        <textarea
          id={id}
          className={cn(ds.textarea, "min-h-20")}
          value={value}
          placeholder={placeholder}
          aria-invalid={over || !!error}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input id={id} className={ds.input} value={value} placeholder={placeholder} aria-invalid={over || !!error} onChange={(e) => onChange(e.target.value)} />
      )}
      <FieldError>{error}</FieldError>
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}
