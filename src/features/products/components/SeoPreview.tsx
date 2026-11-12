import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  STOREFRONT_ORIGIN,
  truncateForPreview,
} from "../products.helpers";

type SeoPreviewProps = {
  slug: string;
  /** The title the storefront will use (meta title, or its default). */
  title: string;
  /** The description the storefront will use (meta description, or its default). */
  description: string;
};

/** Roughly how the product appears as a Google result. */
export function SeoPreview({ slug, title, description }: SeoPreviewProps) {
  const host = STOREFRONT_ORIGIN.replace(/^https?:\/\//, "");
  return (
    <div className="rounded-xl border bg-white p-4" aria-label="Search result preview">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Google preview</p>
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
          A
        </span>
        <div className="min-w-0 leading-tight">
          <p className="text-[13px] text-foreground">Aariy</p>
          <p className="truncate text-xs text-muted-foreground">
            {host} › products › {slug || "…"}
          </p>
        </div>
      </div>
      <p className="mt-2 break-words text-lg leading-snug text-[#1a0dab]">
        {title ? truncateForPreview(title, META_TITLE_MAX) : "Product name by Seller"}
      </p>
      <p className="mt-1 break-words text-[13px] leading-relaxed text-[#4d5156]">
        {description
          ? truncateForPreview(description, META_DESCRIPTION_MAX)
          : "Add a description or meta description so shoppers know what they will get."}
      </p>
    </div>
  );
}
