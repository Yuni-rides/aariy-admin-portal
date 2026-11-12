"use client";

import { useEffect, useState } from "react";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SavePageDto, StorefrontPage } from "../settings.types";
import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  SLUG_PATTERN,
  formatStamp,
  pageStatusLabelMap,
  pageStatusToneMap,
  renderMarkdown,
} from "../settings.helpers";
import { MarkdownEditor } from "./MarkdownEditor";

type Result = { success: boolean; message: string };

type PagesTabProps = {
  pages: StorefrontPage[];
  saving: boolean;
  onSave: (dto: SavePageDto, publish: boolean, id?: string) => Promise<Result & { id?: string }>;
  onUnpublish: (id: string) => Promise<Result>;
  onDelete: (id: string) => Promise<Result>;
};

const NEW = "__new__";
const EMPTY: SavePageDto = { title: "", slug: "", content: "", metaTitle: "", metaDescription: "" };

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

const toDto = (p: StorefrontPage): SavePageDto => ({
  title: p.title,
  slug: p.slug,
  content: p.content,
  metaTitle: p.metaTitle,
  metaDescription: p.metaDescription,
});

const sameDto = (a: SavePageDto, b: SavePageDto) =>
  (Object.keys(a) as (keyof SavePageDto)[]).every((k) => a[k] === b[k]);

export function PagesTab({ pages, saving, onSave, onUnpublish, onDelete }: PagesTabProps) {
  const [selectedId, setSelectedId] = useState<string>(pages[0]?.id ?? NEW);
  const [form, setForm] = useState<SavePageDto>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SavePageDto, string>>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const page = pages.find((p) => p.id === selectedId);
  const isNew = selectedId === NEW;
  const base = page ? toDto(page) : EMPTY;
  const dirty = !sameDto(form, base);

  // Load the selected page into the form.
  useEffect(() => {
    const p = pages.find((x) => x.id === selectedId);
    setForm(p ? toDto(p) : EMPTY);
    setSlugTouched(!!p);
    setErrors({});
    // Only when switching pages, not on every save of the same page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Warn before leaving the browser tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const select = (id: string) => {
    if (id === selectedId) return;
    if (dirty) setPendingSwitch(id);
    else setSelectedId(id);
  };

  const update = <K extends keyof SavePageDto>(key: K, value: SavePageDto[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (publish: boolean) => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = "Page title is required";
    if (!SLUG_PATTERN.test(form.slug.trim())) e.slug = "Lowercase letters, numbers and dashes only";
    else if (pages.some((p) => p.slug === form.slug.trim() && p.id !== page?.id))
      e.slug = "Another page already uses this URL";
    if (publish && !form.content.trim()) e.content = "Add content before publishing";
    if (form.metaTitle.length > META_TITLE_MAX) e.metaTitle = `Keep it under ${META_TITLE_MAX} characters`;
    if (form.metaDescription.length > META_DESCRIPTION_MAX)
      e.metaDescription = `Keep it under ${META_DESCRIPTION_MAX} characters`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (publish: boolean) => {
    if (!validate(publish)) return;
    const res = await onSave(form, publish, page?.id);
    if (res.success && isNew && res.id) setSelectedId(res.id);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
      {/* Page list */}
      <Card className="flex flex-col gap-2 rounded-2xl p-[18px] shadow-none">
        <h2 className="text-[15px] font-semibold">Pages</h2>
        <ul className="flex flex-col">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-current={p.id === selectedId}
                onClick={() => select(p.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left",
                  p.id === selectedId ? "bg-accent" : "hover:bg-muted",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">/{p.slug}</span>
                </span>
                <StatusBadge tone={pageStatusToneMap[p.status]}>{pageStatusLabelMap[p.status]}</StatusBadge>
              </button>
            </li>
          ))}
          {isNew && (
            <li>
              <div className="flex items-center justify-between rounded-[10px] bg-accent px-3 py-2.5 text-sm font-medium">
                {form.title || "New page"}
                <StatusBadge tone="neutral">New</StatusBadge>
              </div>
            </li>
          )}
        </ul>
        <Button
          variant="secondary"
          className="mt-1 min-h-11 cursor-pointer rounded-[10px]"
          onClick={() => select(NEW)}
          disabled={isNew}
        >
          <Plus /> Add page
        </Button>
      </Card>

      {/* Editor */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(true);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold">{isNew ? "New page" : page?.title}</h2>
            <div className="flex items-center gap-2">
              {dirty && <StatusBadge tone="warning">Not saved</StatusBadge>}
              {page && (
                <StatusBadge tone={pageStatusToneMap[page.status]}>{pageStatusLabelMap[page.status]}</StatusBadge>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pg-title" className={labelClass}>Page title</Label>
              <Input
                id="pg-title"
                className="h-11 rounded-[10px] bg-white"
                value={form.title}
                aria-invalid={!!errors.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
                }}
              />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title}</p>}
            </div>
            <div>
              <Label htmlFor="pg-slug" className={labelClass}>URL slug</Label>
              <div className="flex h-11 items-center overflow-hidden rounded-[10px] border border-input bg-white focus-within:ring-1 focus-within:ring-ring">
                <span className="pl-3 text-sm text-muted-foreground">/</span>
                <input
                  id="pg-slug"
                  className="h-full min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none"
                  value={form.slug}
                  aria-invalid={!!errors.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    update("slug", e.target.value);
                  }}
                />
              </div>
              {errors.slug ? (
                <p className="mt-1 text-xs text-destructive">{errors.slug}</p>
              ) : (
                page?.status === "PUBLISHED" &&
                form.slug !== page.slug && (
                  <p className="mt-1 text-xs text-[#8A5A00]">Changing the URL breaks links to /{page.slug}.</p>
                )
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="pg-content" className={labelClass}>Content</Label>
            <MarkdownEditor
              id="pg-content"
              value={form.content}
              invalid={!!errors.content}
              placeholder="Page content, written or pasted by staff. Text for legal pages comes from counsel."
              onChange={(v) => update("content", v)}
            />
            {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="pg-meta-title" className={labelClass}>Meta title</Label>
              <Input
                id="pg-meta-title"
                className="h-11 rounded-[10px] bg-white"
                value={form.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
              />
              <p className={cn("mt-1 text-xs", errors.metaTitle ? "text-destructive" : "text-muted-foreground")}>
                {errors.metaTitle ?? `${form.metaTitle.length}/${META_TITLE_MAX}`}
              </p>
            </div>
            <div>
              <Label htmlFor="pg-meta-desc" className={labelClass}>Meta description</Label>
              <Textarea
                id="pg-meta-desc"
                rows={2}
                className="rounded-[10px] bg-white"
                value={form.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
              />
              <p className={cn("mt-1 text-xs", errors.metaDescription ? "text-destructive" : "text-muted-foreground")}>
                {errors.metaDescription ?? `${form.metaDescription.length}/${META_DESCRIPTION_MAX}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
              {page?.status === "PUBLISHED" ? "Publish changes" : "Publish"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => save(false)}
            >
              Save draft
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye /> Preview
            </Button>
            {page?.status === "PUBLISHED" && (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() => onUnpublish(page.id)}
              >
                Unpublish
              </Button>
            )}
            {page && !page.isSystem && (
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete page
              </Button>
            )}
          </div>

          {page && (
            <p className="text-[13px] text-muted-foreground">
              Last edited by {page.updatedBy}, {formatStamp(page.updatedAt)}. Every change is logged.
              {page.status === "PUBLISHED" && dirty && " Saving a draft keeps the published version live."}
            </p>
          )}
        </form>
      </Card>

      {/* Preview */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} className="h-auto max-w-2xl">
        <div className="flex max-h-[85vh] flex-col rounded-2xl bg-white shadow-lg">
          <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Preview · /{form.slug || "…"}</p>
              <h2 className="truncate text-lg font-semibold">{form.metaTitle || form.title || "Untitled page"}</h2>
            </div>
            <Button variant="secondary" className="cursor-pointer rounded-[10px]" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
          <div
            className="overflow-y-auto px-6 py-4 text-sm leading-relaxed"
            // renderMarkdown escapes the input and only emits its own tags.
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(form.content) || '<p class="text-muted-foreground">No content yet.</p>',
            }}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingSwitch !== null}
        title="Discard unsaved changes?"
        description="Your edits to this page haven't been saved."
        confirmLabel="Discard"
        destructive
        onClose={() => setPendingSwitch(null)}
        onConfirm={() => {
          if (pendingSwitch) setSelectedId(pendingSwitch);
          setPendingSwitch(null);
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${page?.title ?? "this page"}?`}
        description={`/${page?.slug ?? ""} will stop working on the storefront. This can't be undone.`}
        confirmLabel="Delete page"
        destructive
        loading={saving}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!page) return;
          const res = await onDelete(page.id);
          if (res.success) {
            setConfirmDelete(false);
            setSelectedId(pages.find((p) => p.id !== page.id)?.id ?? NEW);
          }
        }}
      />
    </div>
  );
}
