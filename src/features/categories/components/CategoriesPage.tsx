"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/hooks/useToast";
import { useCategoriesStore } from "../categories.store";
import {
  buildCategoryTree,
  canHaveChildren,
  getSiblings,
} from "../categories.helpers";
import { Category, CreateCategoryDto } from "../categories.types";
import { CategoryTree } from "./CategoryTree";
import { CategoryEditor } from "./CategoryEditor";
import { ReorderSiblingsModal } from "./ReorderSiblingsModal";
import { mediaApi } from "@/shared/api/media.api";
import { Pagination } from "@/components/ui/Pagination";

export default function CategoriesPage() {
  const {
    categories,
        meta,
setPage,
    loading,
    saving,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderSiblings,
  } = useCategoriesStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** undefined = not creating; null = top level; string = parent id. */
  const [createParentId, setCreateParentId] = useState<string | null | undefined>(undefined);
  const creating = createParentId !== undefined;
  const startCreate = (parentId: string | null) => setCreateParentId(parentId);
  const stopCreate = () => setCreateParentId(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);


  const findCategoryById = (
  items: Category[],
  id: string | null,
): Category | undefined => {
  if (!id) return undefined;
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findCategoryById(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

const flattenCategories = (items: Category[]): Category[] => {
  const map = new Map<string, Category>();

  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (!map.has(node.id)) {
        map.set(node.id, node);
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };

  walk(items);
  return Array.from(map.values());
};

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Select the first category once data arrives.
  useEffect(() => {
    if (!selectedId && !creating && categories.length) {
      setSelectedId(categories[0].id);
    }
  }, [categories, selectedId, creating]);

const flatCategories = useMemo(
  () => flattenCategories(categories),
  [categories],
);
const tree = useMemo(() => buildCategoryTree(flatCategories), [flatCategories]);
const selected = useMemo(
  () => findCategoryById(flatCategories, selectedId),
  [flatCategories, selectedId],
);
  const siblings = useMemo(
    () => (selected ? getSiblings(categories, selected.parentId) : []),
    [categories, selected],
  );
  const parentName =
    categories.find((c) => c.id === selected?.parentId)?.name ?? "top level";

  const notify = (res: { success: boolean; message: string }) =>
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Couldn't save", description: res.message },
    );
const handleSubmit = async (dto: CreateCategoryDto) => {
    const { file, ...restDto } = dto;
    let uploadedKey: string | undefined;

    if (file) {
      console.log(file)
      try {
        const uploaded = await mediaApi.uploadFile(file, {
          fieldName: "file",
        });
        uploadedKey = uploaded.key;
      } catch (err: any) {
        const message =
          err?.response?.data?.message ?? err?.message ?? "Image upload failed";
        notify({ success: false, message });
        return; // Upload fail ho to category create/update na karein
      }
    }

    // Uploaded imageKey ko clean dto ke saath merge karein (baghair `file` object ke)
    const payload: CreateCategoryDto = {
      ...restDto,
      ...(uploadedKey ? { imageKey: uploadedKey } : {}),
    };

    if (creating) {
      const res = await createCategory(payload);
      notify(res);
      if (res.success && res.id) {
        stopCreate();
        setSelectedId(res.id);
      }
      return;
    }

    if (selected) {
      notify(await updateCategory(selected.id, payload));
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const res = await deleteCategory(selected.id);
    notify(res);
    setDeleteOpen(false);
    if (res.success) setSelectedId(selected.parentId);
  };
const toggleCategoryStatus = useCategoriesStore((s) => s.toggleCategoryStatus);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button
          className="min-h-11 cursor-pointer rounded-[10px]"
          onClick={() => startCreate(null)}
        >
          <Plus /> Add top-level category
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-[18px] shadow-none">
          <h2 className="text-[15px] font-semibold">Menu tree</h2>
          <p className="mb-3 mt-1 text-[13px] text-muted-foreground">
            Use + next to a category to add a sub-category under it.
          </p>
          {loading && categories.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <CategoryTree
              nodes={tree}
              selectedId={creating ? createParentId ?? null : selectedId}
              canAddChild={(id) => canHaveChildren(categories, id)}
              onAddChild={(id) => {
                setSelectedId(id);
                startCreate(id);
              }}
              onSelect={(id) => {
                stopCreate();
                setSelectedId(id);
              }}
            />
          )}


  <Pagination
                      page={meta.page}
                      total={meta.total}
                      limit={meta.limit}
                      onPageChange={(newPage) => setPage(newPage)}
                    />
            
        </Card>

        <div className="lg:col-span-2">
          {creating ? (
            <CategoryEditor
              categories={categories}
              defaultParentId={createParentId}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={stopCreate}
            />
          ) : selected ? (
            <CategoryEditor
              categories={categories}
              category={selected}
              saving={saving}
              onSubmit={handleSubmit}
              onAddChild={
                canHaveChildren(categories, selected.id)
                  ? () => startCreate(selected.id)
                  : undefined
              }
              onToggleStatus={async (id, isActive) => {
    const res = await toggleCategoryStatus(id, isActive);
    if (res.success) {
toast({
      title: "Success",
      description: res.message,
    });    } else {
toast({
      variant: "destructive",
      title: "Error",
      description: res.message,
    });
      }
  }}
              onDelete={() => setDeleteOpen(true)}
              onReorder={() => setReorderOpen(true)}
            />
          ) : (
            <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
              Select a category from the menu tree to edit it.
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete category"
        description={
          <>
            Delete <span className="font-medium text-foreground">{selected?.name}</span>?
            This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ReorderSiblingsModal
        open={reorderOpen}
        siblings={siblings}
        parentName={parentName}
        onClose={() => setReorderOpen(false)}
        onSave={async (ids) => {
          notify(await reorderSiblings(ids));
          setReorderOpen(false);
        }}
      />
    </div>
  );
}
