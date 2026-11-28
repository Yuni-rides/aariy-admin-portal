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
  const host = STOREFRONT_ORIGIN.replace(/^https?:\/\/(www\.)?/, "");
  return (
    <div
      className="flex flex-col gap-1 rounded-[10px] border border-[#EADFD8] bg-white p-4"
      aria-label="Search result preview"
    >
      <span className="break-all text-xs text-[#4D5156]">
        {host} › products › {slug || "…"}
      </span>
      <span className="break-words text-lg leading-[1.3] text-[#1A0DAB]">
        {title ? truncateForPreview(title, META_TITLE_MAX) : "Product name by Brand"}
      </span>
      <span className="break-words text-[13px] leading-normal text-[#4D5156]">
        {description
          ? truncateForPreview(description, META_DESCRIPTION_MAX)
          : "Add a description so shoppers know what they will get."}
      </span>
    </div>
  );
}
