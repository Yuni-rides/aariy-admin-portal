// "use client";

// import { useEffect, useMemo, useRef, useState } from "react";
// import { ArrowUpDown, ImagePlus, Plus, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/Button";
// import { Card } from "@/components/ui/Card";
// import { Checkbox } from "@/components/ui/Checkbox";
// import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/Label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/Select";
// import { StatusBadge } from "@/components/ui/StatusBadge";
// import { slugify } from "@/lib/format";
// import { Category, CreateCategoryDto } from "../categories.types";
// import {
//   getCategoryPath,
//   getParentOptions,
//   getSiblings,
//   hasChildren,
// } from "../categories.helpers";
// import { env } from "@/core/env/env";

// const ROOT = "__root__";

// type CategoryEditorProps = {
//   categories: Category[];
//   /** Undefined = creating a new category. */
//   category?: Category;
//   defaultParentId?: string | null;
//   saving: boolean;
//   onSubmit: (dto: CreateCategoryDto) => void;
//   onToggleStatus?: (id: string, isActive: boolean) => Promise<void> | void; // <-- Naya prop
//   onCancel?: () => void;
//   onDelete?: () => void;
//   onReorder?: () => void;
//   /** Shown in edit mode when this category can take sub-categories. */
//   onAddChild?: () => void;
// };

// const emptyForm = (parentId: string | null): CreateCategoryDto => ({
//   name: "",
//   slug: "",
//   parentId,
//   imageKey: null,
//   showInMenu: true,
//   isActive: true,
//   isCurated: false,
//   sortOrder: 1,
// });

// export function CategoryEditor({
//   categories,
//   category,
//   defaultParentId = null,
//   saving,
//   onSubmit,
//   onToggleStatus, // <-- Yahan receive karein
//   onCancel,
//   onDelete,
//   onReorder,
//   onAddChild,


// }: CategoryEditorProps) {
//   const isEdit = !!category;
//   const [form, setForm] = useState<CreateCategoryDto>(emptyForm(defaultParentId));
//   const [slugTouched, setSlugTouched] = useState(false);
//   /** Until it's typed, a new category goes last under its parent. */
//   const [sortTouched, setSortTouched] = useState(false);
//   const [errors, setErrors] = useState<{ name?: string; slug?: string; sortOrder?: string }>({});
//   const fileRef = useRef<HTMLInputElement>(null);


//   // 1. Selected File aur Local Preview ke liye alag states
// const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(
//     category?.imageKey ?? null
//   );

//   // Jab category selection change ho (Create vs Edit switch), preview aur file reset karein
//  useEffect(() => {
//   if (previewUrl?.startsWith("blob:")) {
//     URL.revokeObjectURL(previewUrl);
//   }
//   setSelectedFile(null);

//   if (category?.imageKey) {
//     setPreviewUrl(`${env.NEXT_PUBLIC_MEDIA_BASE_URL}${category.imageKey}`);
//   } else {
//     setPreviewUrl(null);
//   }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [category?.id, isEdit]);

//   const parentOptions = useMemo(
//     () => getParentOptions(categories, category?.id),
//     [categories, category?.id],
//   );

//   useEffect(() => {
//     setErrors({});
//     if (category) {
//       setForm({
//         name: category.name,
//         slug: category.slug,
//         parentId: category.parentId,
// imageKey: category.imageKey
//   ? `${env.NEXT_PUBLIC_MEDIA_BASE_URL}${category.imageKey}`
//   : null,        showInMenu: category.showInMenu,
//         isActive: category.isActive,
//         isCurated: category.isCurated,
//         sortOrder: category.sortOrder,
//       });
//       setSortTouched(false);
//       setSlugTouched(true);
//     } else {
//       const parentAllowed = parentOptions.some((o) => o.id === defaultParentId);
//       setForm(emptyForm(parentAllowed ? defaultParentId : null));
//       setSortTouched(false);
//       setSlugTouched(false);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [category, defaultParentId]);

//   const path = category ? getCategoryPath(categories, category.id) : [];
//   const level = isEdit
//     ? path.length
//     : (form.parentId ? getCategoryPath(categories, form.parentId).length : 0) + 1;
//   const isLeaf = category ? !hasChildren(categories, category.id) : true;
//   const canDelete = isEdit && isLeaf && category!.productCount === 0;

//   // Positions available under the chosen parent (one more if this category joins that level).
// const siblingCount = getSiblings(categories, form.parentId ?? null).filter(
//   (c) => c.id !== category?.id
// ).length;
// const maxPosition = siblingCount + 1;

//   // Until the field is typed in: an existing category under its own parent keeps its
//   // position; a new category, or one moved to another parent, goes last.
//   useEffect(() => {
//     if (sortTouched) return;
//     setForm((f) => {
//       const target = category && f.parentId === category.parentId ? category.sortOrder : maxPosition;
//       return f.sortOrder === target ? f : { ...f, sortOrder: target };
//     });
//   }, [maxPosition, sortTouched, category]);

//   const update = <K extends keyof CreateCategoryDto>(
//     key: K,
//     value: CreateCategoryDto[K],
//   ) => setForm((f) => ({ ...f, [key]: value }));

//   const handleName = (name: string) => {
//     setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
//   };

// const handleImage = (file?: File) => {
//     if (!file) return;
//     if (previewUrl?.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     setSelectedFile(file);
//     setPreviewUrl(URL.createObjectURL(file));
//   };

//     const handleRemoveImage = () => {
//     if (previewUrl?.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }
//     setSelectedFile(null);
//     setPreviewUrl(null);
//     update("imageKey", null);
//     if (fileRef.current) fileRef.current.value = "";
//   };
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     const next: typeof errors = {};
//     if (!form.name.trim()) next.name = "Name is required";
//     if (!Number.isInteger(form.sortOrder) || form.sortOrder < 1 || form.sortOrder > maxPosition)
//       next.sortOrder = `Use a number from 1 to ${maxPosition}`;
//     if (!form.slug?.trim()) next.slug = "Slug is required";
//     else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug))
//       next.slug = "Use lowercase letters, numbers and dashes only";
//     setErrors(next);
//     if (Object.keys(next).length) return;if (isEdit) {
//       onSubmit({
//         name: form.name.trim(),
//         sortOrder: form.sortOrder,
//         ...(selectedFile ? { file: selectedFile } : {}),
//         ...(form.imageKey === null && !selectedFile ? { imageKey: null } : {}),
//       });
//     } else {
//       onSubmit({
//         ...form,
//         name: form.name.trim(),
//         slug: form.slug?.trim() || null,
//         imageKey: null,
//         file: selectedFile,
//       });
//     }
// };

//   return (
//     <Card className="rounded-2xl p-[18px] shadow-none">
//       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <h2 className="text-[15px] font-semibold">
//             {isEdit
//               ? category!.name
//               : form.parentId
//                 ? `New sub-category under ${categories.find((c) => c.id === form.parentId)?.name ?? ""}`
//                 : "New top-level category"}
//           </h2>
//           {isEdit && (
//             <StatusBadge tone={category!.isActive ? "success" : "neutral"}>
//               {category!.isActive ? "Active" : "Inactive"}
//             </StatusBadge>
//           )}
//         </div>

//         <p className="text-[13px] text-muted-foreground">
//           {isEdit && (
//             <>
//               Path: {path.map((c) => c.slug).join(" / ")} ·{" "}
//             </>
//           )}
//           Level {level}
//           {isEdit && isLeaf ? " (accepts products)" : ""}
//           {isEdit && category!.productCount > 0
//             ? ` · ${category!.productCount} products`
//             : ""}
//         </p>

//         <div className="grid gap-4 sm:grid-cols-2">
//           <div>
//             <Label htmlFor="cat-name" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
//               Name
//             </Label>
//             <Input
//               id="cat-name"
//               className="h-11 rounded-[10px] bg-white"
//               value={form.name}
//               onChange={(e) => handleName(e.target.value)}
//               aria-invalid={!!errors.name}
//             />
//             {errors.name && (
//               <p className="mt-1 text-xs text-destructive">{errors.name}</p>
//             )}
//           </div>
//           <div>
//             <Label htmlFor="cat-slug" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
//               Slug
//             </Label>
//             <Input
//               id="cat-slug"
//               className="h-11 rounded-[10px] bg-white"
//               value={form.slug ??""}
//               onChange={(e) => {
//                 setSlugTouched(true);
//                 update("slug", e.target.value);
//               }}
//               aria-invalid={!!errors.slug}
//             />
//             {errors.slug && (
//               <p className="mt-1 text-xs text-destructive">{errors.slug}</p>
//             )}
//           </div>
//         </div>

//         <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
//         <div>
//           <Label className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
//             Parent
//           </Label>
//           <Select
//             value={form.parentId ?? ROOT}
//             onValueChange={(v) => {
//               update("parentId", v === ROOT ? null : v);
//               // A new parent means a new list of siblings; start at the end of it.
//               setSortTouched(false);
//             }}
//           >
//             <SelectTrigger className="h-11 cursor-pointer rounded-[10px] bg-white">
//               <SelectValue placeholder="Select parent" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value={ROOT}>None (top level)</SelectItem>
//               {parentOptions.map((opt) => (
//                 <SelectItem key={opt.id} value={opt.id}>
//                   {opt.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//         <div>
//           <Label htmlFor="cat-sort" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
//             Sort order
//           </Label>
//           <Input
//             id="cat-sort"
//             type="number"
//             min={1}
//             max={maxPosition}
//             step={1}
//             className="h-11 rounded-[10px] bg-white"
//             value={Number.isNaN(form.sortOrder) ? "" : form.sortOrder}
//             onChange={(e) => {
//               setSortTouched(true);
//               update("sortOrder", e.target.value === "" ? NaN : Number(e.target.value));
//             }}
//             aria-invalid={!!errors.sortOrder}
//             aria-describedby="cat-sort-hint"
//           />
//           {errors.sortOrder ? (
//             <p className="mt-1 text-xs text-destructive">{errors.sortOrder}</p>
//           ) : (
//             <p id="cat-sort-hint" className="mt-1 text-xs text-muted-foreground">
//               1 = first, {maxPosition} = last
//             </p>
//           )}
//         </div>
//         </div>

//         <div className="flex flex-wrap items-center gap-3">
//           {previewUrl? (
//             // eslint-disable-next-line @next/next/no-img-element
//             <img
//               src={previewUrl}
//               alt=""
//               className="h-[72px] w-[72px] rounded-full border object-cover"
//             />
//           ) : (
//             <div className="grid h-[72px] w-[72px] place-items-center rounded-full border border-dashed border-[#D9805B] bg-accent text-[#D9805B]">
//               <ImagePlus className="h-5 w-5" />
//             </div>
//           )}
//           <div>
//             <input
//               ref={fileRef}
//               type="file"
//               accept="image/*"
//               className="hidden"
//               onChange={(e) => handleImage(e.target.files?.[0])}
//             />
//             <div className="flex gap-2">
//               <Button
//                 type="button"
//                 variant="secondary"
//                 className="min-h-11 cursor-pointer rounded-[10px]"
//                 onClick={() => fileRef.current?.click()}
//               >
//                 {previewUrl ? "Change image" : "Upload circle image"}
//               </Button>
//               {previewUrl && (
//                 <Button
//                   type="button"
//                   variant="ghost"
//                   className="min-h-11 cursor-pointer rounded-[10px]"
//                   onClick={handleRemoveImage}
//                 >
//                   Remove
//                 </Button>
//               )}
//             </div>
//             <p className="mt-1 text-[13px] text-muted-foreground">
//               Shown in the storefront menu
//             </p>
//           </div>
//         </div>

//  <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
//   {(
//     [
//       ["showInMenu", "Show in menu"],
//       ["isActive", "Active"],
//       ["isCurated", "Curated (indexed by search engines)"],
//     ] as const
//   ).map(([key, label]) => (
//     <label key={key} className="flex cursor-pointer items-center gap-2">
//       <Checkbox
//         checked={form[key] ?? false}
//         disabled={saving}
//         onCheckedChange={(v) => {
//           const checked = v === true;
//           update(key, checked);

//           // Sirf Edit mode mein 'Active' toggle hone par direct API hit karein
//           if (key === "isActive" && isEdit && category && onToggleStatus) {
//             onToggleStatus(category.id, checked);
//           }
//         }}
//         className="h-5 w-5 rounded"
//       />
//       {label}
//     </label>
//   ))}
// </div>

//         <p className="text-[13px] text-muted-foreground">
//           Products only go in last-level categories. A category with products
//           can be hidden, not deleted.
//         </p>

//         <div className="flex flex-wrap gap-3">
//           <Button
//             type="submit"
//             disabled={saving}
//             className="min-h-11 cursor-pointer rounded-[10px]"
//           >
//             {saving ? "Saving..." : isEdit ? "Save changes" : "Create category"}
//           </Button>
//           {isEdit && onAddChild && (
//             <Button
//               type="button"
//               variant="secondary"
//               className="min-h-11 cursor-pointer rounded-[10px]"
//               onClick={onAddChild}
//             >
//               <Plus /> Add sub-category
//             </Button>
//           )}
//           {isEdit && onReorder && (
//             <Button
//               type="button"
//               variant="secondary"
//               className="min-h-11 cursor-pointer rounded-[10px]"
//               onClick={onReorder}
//             >
//               <ArrowUpDown /> Reorder siblings
//             </Button>
//           )}
//           {!isEdit && onCancel && (
//             <Button
//               type="button"
//               variant="secondary"
//               className="min-h-11 cursor-pointer rounded-[10px]"
//               onClick={onCancel}
//             >
//               Cancel
//             </Button>
//           )}
//           {isEdit && onDelete && (
//             <Button
//               type="button"
//               variant="ghost"
//               className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
//               disabled={!canDelete}
//               title={
//                 canDelete
//                   ? "Delete category"
//                   : "Only empty last-level categories can be deleted"
//               }
//               onClick={onDelete}
//             >
//               <Trash2 /> Delete
//             </Button>
//           )}
//         </div>
//       </form>
//     </Card>
//   );
// }


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
import {
  Category,
  CategoryField,
  CategoryFieldPayload,
  CategoryFieldType,
  CreateCategoryDto,
} from "../categories.types";
import {
  getCategoryPath,
  getParentOptions,
  getSiblings,
  hasChildren,
} from "../categories.helpers";
import { env } from "@/core/env/env";

const ROOT = "__root__";
type EditableField = Omit<CategoryFieldPayload, "options"> & {
  _localId: string;
  _optionsRaw: string;
  options: string[];
};

type CategoryEditorProps = {
  categories: Category[];
  /** Undefined = creating a new category. */
  category?: Category;
  defaultParentId?: string | null;
  saving: boolean;
  onSubmit: (dto: CreateCategoryDto) => void;
  onToggleStatus?: (id: string, isActive: boolean) => Promise<void> | void;
  onCancel?: () => void;
  onDelete?: () => void;
  onReorder?: () => void;
  /** Shown in edit mode when this category can take sub-categories. */
  onAddChild?: () => void;
};
const makeLocalId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `fld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const parseOptions = (raw: string): string[] =>
  raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toEditableField = (field?: CategoryField): EditableField => {
  const options = field?.options ?? [];
  return {
    _localId: makeLocalId(),
    _optionsRaw: options.join(", "),
    name: field?.name ?? "",
    type: field?.type ?? "TEXT",
    options,
    isRequired: field?.isRequired ?? false,
    isVariant: field?.isVariant ?? false,
    isFilterable: field?.isFilterable ?? false,
  };
};

const emptyForm = (parentId: string | null): CreateCategoryDto => ({
  name: "",
  slug: "",
  parentId,
  imageKey: null,
  showInMenu: true,
  isActive: true,
  isCurated: false,
  sortOrder: 1,
  fields: [],
});

const needsOptions = (type: CategoryFieldType) =>
  type === "DROPDOWN" || type === "MULTI_SELECT";

export function CategoryEditor({
  categories,
  category,
  defaultParentId = null,
  saving,
  onSubmit,
  onToggleStatus,
  onCancel,
  onDelete,
  onReorder,
  onAddChild,
}: CategoryEditorProps) {
  const isEdit = !!category;
  const [form, setForm] = useState<CreateCategoryDto>(emptyForm(defaultParentId));
  const [fields, setFields] = useState<EditableField[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  /** Until it's typed, a new category goes last under its parent. */
  const [sortTouched, setSortTouched] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
    sortOrder?: string;
    fields?: string;
  }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

 useEffect(() => {
  if (previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(previewUrl);
  }
  setSelectedFile(null);

  if (category?.imageKey) {
    setPreviewUrl(`${env.NEXT_PUBLIC_MEDIA_BASE_URL}${category.imageKey}`);
  } else {
    setPreviewUrl(null);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [category?.id, isEdit]);
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
      imageKey: category.imageKey ?? null,
      showInMenu: category.showInMenu,
      isActive: category.isActive,
      isCurated: category.isCurated,
      sortOrder: category.sortOrder,
    });
    setFields((category.fields ?? []).map(toEditableField));
    setSortTouched(false);
    setSlugTouched(true);
  } else {
    const parentAllowed = parentOptions.some((o) => o.id === defaultParentId);
    setForm(emptyForm(parentAllowed ? defaultParentId : null));
    setFields([]);
    setSortTouched(false);
    setSlugTouched(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [category?.id, category?.fields, defaultParentId]);

  const path = category ? getCategoryPath(categories, category.id) : [];
  const level = isEdit
    ? path.length
    : (form.parentId ? getCategoryPath(categories, form.parentId).length : 0) + 1;
  const isLeaf = category ? !hasChildren(categories, category.id) : true;
  const canDelete = isEdit && isLeaf && category!.productCount === 0;

  const siblingCount = getSiblings(categories, form.parentId ?? null).filter(
    (c) => c.id !== category?.id,
  ).length;
  const maxPosition = siblingCount + 1;

  useEffect(() => {
    if (sortTouched) return;
    setForm((f) => {
      const target =
        category && f.parentId === category.parentId ? category.sortOrder : maxPosition;
      return f.sortOrder === target ? f : { ...f, sortOrder: target };
    });
  }, [maxPosition, sortTouched, category]);

  const update = <K extends keyof CreateCategoryDto>(
    key: K,
    value: CreateCategoryDto[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleName = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    update("imageKey", null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAddField = () => {
    setErrors((prev) => ({ ...prev, fields: undefined }));
    setFields((prev) => [...prev, toEditableField()]);
  };

  const handleRemoveField = (localId: string) => {
    setFields((prev) => prev.filter((f) => f._localId !== localId));
  };

  const handleFieldChange = (
    localId: string,
    patch: Partial<EditableField>,
  ) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f._localId !== localId) return f;
        const next = { ...f, ...patch };
        if (patch._optionsRaw !== undefined) {
          next.options = parseOptions(patch._optionsRaw);
        }
        return next;
      }),
    );
  };

  const buildPayloadFields = (): CategoryFieldPayload[] | undefined => {
    if (fields.length === 0) return undefined;

    return fields.map((f) => {
      const base: CategoryFieldPayload = {
        name: f.name.trim(),
        type: f.type,
        
      };

      if (needsOptions(f.type)) {
        base.options = parseOptions(f._optionsRaw);
      }

      if (f.isRequired) base.isRequired = true;
      if (f.isVariant) base.isVariant = true;
      if (f.isFilterable) base.isFilterable = true;

      return base;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (
      !Number.isInteger(form.sortOrder) ||
      form.sortOrder < 1 ||
      form.sortOrder > maxPosition
    ) {
      next.sortOrder = `Use a number from 1 to ${maxPosition}`;
    }
    if (!form.slug?.trim()) {
      next.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) {
      next.slug = "Use lowercase letters, numbers and dashes only";
    }

    for (const f of fields) {
      if (!f.name.trim()) {
        next.fields = "Field name is required for every attribute.";
        break;
      }
      if (needsOptions(f.type) && parseOptions(f._optionsRaw).length === 0) {
        next.fields = `Add at least one option for "${f.name.trim()}".`;
        break;
      }
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const payloadFields = buildPayloadFields();

    if (isEdit) {
      onSubmit({
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        parentId: form.parentId ?? null,
        sortOrder: form.sortOrder,
        showInMenu: form.showInMenu,
        isActive: form.isActive,
        isCurated: form.isCurated,
        ...(selectedFile ? { file: selectedFile } : {}),
        ...(form.imageKey === null && !selectedFile ? { imageKey: null } : {}),
        ...(payloadFields ? { fields: payloadFields } : { fields: [] }),
      });
    } else {
      onSubmit({
        ...form,
        name: form.name.trim(),
        slug: form.slug?.trim() || null,
        imageKey: null,
        file: selectedFile,
        ...(payloadFields ? { fields: payloadFields } : {}),
      });
    }
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
          {isEdit && <>Path: {path.map((c) => c.slug).join(" / ")} · </>}
          Level {level}
          {isEdit && isLeaf ? " (accepts products)" : ""}
          {isEdit && category!.productCount > 0
            ? ` · ${category!.productCount} products`
            : ""}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="cat-name"
              className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
            >
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
            <Label
              htmlFor="cat-slug"
              className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
            >
              Slug
            </Label>
            <Input
              id="cat-slug"
              className="h-11 rounded-[10px] bg-white"
              value={form.slug ?? ""}
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

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <Label className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
              Parent
            </Label>
            <Select
              value={form.parentId ?? ROOT}
              onValueChange={(v) => {
                update("parentId", v === ROOT ? null : v);
                setSortTouched(false);
              }}
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
          <div>
            <Label
              htmlFor="cat-sort"
              className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
            >
              Sort order
            </Label>
            <Input
              id="cat-sort"
              type="number"
              min={1}
              max={maxPosition}
              step={1}
              className="h-11 rounded-[10px] bg-white"
              value={Number.isNaN(form.sortOrder) ? "" : form.sortOrder}
              onChange={(e) => {
                setSortTouched(true);
                update(
                  "sortOrder",
                  e.target.value === "" ? NaN : Number(e.target.value),
                );
              }}
              aria-invalid={!!errors.sortOrder}
              aria-describedby="cat-sort-hint"
            />
            {errors.sortOrder ? (
              <p className="mt-1 text-xs text-destructive">{errors.sortOrder}</p>
            ) : (
              <p
                id="cat-sort-hint"
                className="mt-1 text-xs text-muted-foreground"
              >
                1 = first, {maxPosition} = last
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
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
                {previewUrl ? "Change image" : "Upload circle image"}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 cursor-pointer rounded-[10px]"
                  onClick={handleRemoveImage}
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
                checked={form[key] ?? false}
                disabled={saving}
                onCheckedChange={(v) => {
                  const checked = v === true;
                  update(key, checked);
                  if (key === "isActive" && isEdit && category && onToggleStatus) {
                    onToggleStatus(category.id, checked);
                  }
                }}
                className="h-5 w-5 rounded"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Category Product Fields Schema */}
        <div className="rounded-xl border bg-muted/20 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="block text-[13px] font-medium">
                Product fields ({fields.length})
              </Label>
              <p className="text-xs text-muted-foreground">
                Define attributes products under this category will ask for.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="cursor-pointer rounded-[10px]"
              onClick={handleAddField}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Add field
            </Button>
          </div>

          {errors.fields && (
            <p className="mt-2 text-xs text-destructive">{errors.fields}</p>
          )}

          {fields.length > 0 && (
            <div className="mt-3 flex flex-col gap-2.5">
              {fields.map((field) => (
                <div
                  key={field._localId}
                  className="rounded-xl border bg-white p-3"
                >
                  <div className="grid gap-2.5 sm:grid-cols-[1fr_170px_auto]">
                    <Input
                      className="h-10 rounded-[10px]"
                      value={field.name}
                      placeholder="Field name (e.g. Size, Fabric, Work)"
                      onChange={(e) =>
                        handleFieldChange(field._localId, {
                          name: e.target.value,
                        })
                      }
                    />

                    <Select
                      value={field.type}
                      onValueChange={(val) =>
                        handleFieldChange(field._localId, {
                          type: val as CategoryFieldType,
                        })
                      }
                    >
                      <SelectTrigger className="h-10 cursor-pointer rounded-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TEXT">TEXT</SelectItem>
                        <SelectItem value="NUMBER">NUMBER</SelectItem>
                        <SelectItem value="DROPDOWN">DROPDOWN</SelectItem>
                        <SelectItem value="MULTI_SELECT">MULTI_SELECT</SelectItem>
                        <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 cursor-pointer text-destructive"
                      onClick={() => handleRemoveField(field._localId)}
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {needsOptions(field.type) && (
                    <div className="mt-2.5">
                      <Input
                        className="h-10 rounded-[10px] text-xs"
                        value={field._optionsRaw}
                        placeholder="Options (comma-separated, e.g. S, M, L, XL)"
                        onChange={(e) =>
                          handleFieldChange(field._localId, {
                            _optionsRaw: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="mt-2.5 flex flex-wrap gap-4 text-xs">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <Checkbox
                        checked={!!field.isRequired}
                        onCheckedChange={(v) =>
                          handleFieldChange(field._localId, {
                            isRequired: v === true,
                          })
                        }
                      />
                      Required
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5">
                      <Checkbox
                        checked={!!field.isVariant}
                        onCheckedChange={(v) =>
                          handleFieldChange(field._localId, {
                            isVariant: v === true,
                          })
                        }
                      />
                      Variant
                    </label>

                    <label className="flex cursor-pointer items-center gap-1.5">
                      <Checkbox
                        checked={!!field.isFilterable}
                        onCheckedChange={(v) =>
                          handleFieldChange(field._localId, {
                            isFilterable: v === true,
                          })
                        }
                      />
                      Filterable
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
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