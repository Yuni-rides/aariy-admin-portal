"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { slugify } from "@/lib/format";
import { Category, CreateCategoryDto } from "../categories.types";
import {
  getCategoryPath,
  getParentOptions,
  hasChildren,
} from "../categories.helpers";

const ROOT = "__root__";

type CategoryEditorProps = {
  categories: Category[];
  /** Undefined = creating a new category. */
  category?: Category;
  defaultParentId?: string | null;
  saving: boolean;
  onSubmit: (dto: CreateCategoryDto) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  onReorder?: () => void;
  /** Shown in edit mode when this category can take sub-categories. */
  onAddChild?: () => void;
};

const emptyForm = (parentId: string | null): CreateCategoryDto => ({
  name: "",
  slug: "",
  parentId,
  imageUrl: null,
  showInMenu: true,
  isActive: true,
  isCurated: false,
});

export function CategoryEditor({
  categories,
  category,
  defaultParentId = null,
  saving,
  onSubmit,
  onCancel,
  onDelete,
  onReorder,
  onAddChild,
}: CategoryEditorProps) {
  const isEdit = !!category;
  const [form, setForm] = useState<CreateCategoryDto>(emptyForm(defaultParentId));
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; slug?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const parentOptions = useMemo(
    () => getParentOptions(categories, category?.id),
    [categories, category?.id],
  );

  useEffect(() => {
    setErrors({});
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        imageUrl: category.imageUrl ?? null,
        showInMenu: category.showInMenu,
        isActive: category.isActive,
        isCurated: category.isCurated,
      });
      setSlugTouched(true);
    } else {
      const parentAllowed = parentOptions.some((o) => o.id === defaultParentId);
      setForm(emptyForm(parentAllowed ? defaultParentId : null));
      setSlugTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, defaultParentId]);

  const path = category ? getCategoryPath(categories, category.id) : [];
  const level = isEdit
    ? path.length
    : (form.parentId ? getCategoryPath(categories, form.parentId).length : 0) + 1;
  const isLeaf = category ? !hasChildren(categories, category.id) : true;
  const canDelete = isEdit && isLeaf && category!.productCount === 0;

  const update = <K extends keyof CreateCategoryDto>(
    key: K,
    value: CreateCategoryDto[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleName = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    // TODO(api): upload the file and store the returned URL instead.
    update("imageUrl", URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.slug.trim()) next.slug = "Slug is required";
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug))
      next.slug = "Use lowercase letters, numbers and dashes only";
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ ...form, name: form.name.trim() });
  };

  return (
    <Card className="rounded-2xl p-[18px] shadow-none">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">
            {isEdit
              ? category!.name
              : form.parentId
                ? `New sub-category under ${categories.find((c) => c.id === form.parentId)?.name ?? ""}`
                : "New top-level category"}
          </h2>
          {isEdit && (
            <StatusBadge tone={category!.isActive ? "success" : "neutral"}>
              {category!.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          )}
        </div>

        <p className="text-[13px] text-muted-foreground">
          {isEdit && (
            <>
              Path: {path.map((c) => c.slug).join(" / ")} ·{" "}
            </>
          )}
          Level {level}
          {isEdit && isLeaf ? " (accepts products)" : ""}
          {isEdit && category!.productCount > 0
            ? ` · ${category!.productCount} products`
            : ""}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cat-name" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
              Name
            </Label>
            <Input
              id="cat-name"
              className="h-11 rounded-[10px] bg-white"
              value={form.name}
              onChange={(e) => handleName(e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cat-slug" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
              Slug
            </Label>
            <Input
              id="cat-slug"
              className="h-11 rounded-[10px] bg-white"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
              aria-invalid={!!errors.slug}
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-destructive">{errors.slug}</p>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Parent
          </Label>
          <Select
            value={form.parentId ?? ROOT}
            onValueChange={(v) => update("parentId", v === ROOT ? null : v)}
          >
            <SelectTrigger className="h-11 cursor-pointer rounded-[10px] bg-white">
              <SelectValue placeholder="Select parent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ROOT}>None (top level)</SelectItem>
              {parentOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {form.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.imageUrl}
              alt=""
              className="h-[72px] w-[72px] rounded-full border object-cover"
            />
          ) : (
            <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-dashed border-[#D9805B] bg-accent text-[#D9805B]">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() => fileRef.current?.click()}
              >
                {form.imageUrl ? "Change image" : "Upload circle image"}
              </Button>
              {form.imageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 cursor-pointer rounded-[10px]"
                  onClick={() => update("imageUrl", null)}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Shown in the storefront menu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {(
            [
              ["showInMenu", "Show in menu"],
              ["isActive", "Active"],
              ["isCurated", "Curated (indexed by search engines)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={form[key]}
                onCheckedChange={(v) => update(key, v === true)}
                className="h-5 w-5 rounded"
              />
              {label}
            </label>
          ))}
        </div>

        <p className="text-[13px] text-muted-foreground">
          Products only go in last-level categories. A category with products
          can be hidden, not deleted.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Create category"}
          </Button>
          {isEdit && onAddChild && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={onAddChild}
            >
              <Plus /> Add sub-category
            </Button>
          )}
          {isEdit && onReorder && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={onReorder}
            >
              <ArrowUpDown /> Reorder siblings
            </Button>
          )}
          {!isEdit && onCancel && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {isEdit && onDelete && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
              disabled={!canDelete}
              title={
                canDelete
                  ? "Delete category"
                  : "Only empty last-level categories can be deleted"
              }
              onClick={onDelete}
            >
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
