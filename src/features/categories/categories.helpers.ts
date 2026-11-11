import { Category, CategoryNode } from "./categories.types";

/** Deepest level allowed in the storefront menu (e.g. Women › Clothing › Eastern RTW › Kurta set). */
export const MAX_CATEGORY_DEPTH = 4;

const bySortOrder = (a: Category, b: Category) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

export function buildCategoryTree(list: Category[]): CategoryNode[] {
  const walk = (parentId: string | null, depth: number): CategoryNode[] =>
    list
      .filter((c) => c.parentId === parentId)
      .sort(bySortOrder)
      .map((c) => ({ ...c, depth, children: walk(c.id, depth + 1) }));
  return walk(null, 1);
}

export function getSiblings(list: Category[], parentId: string | null) {
  return list.filter((c) => c.parentId === parentId).sort(bySortOrder);
}

/** Root → category chain. */
export function getCategoryPath(list: Category[], id: string): Category[] {
  const path: Category[] = [];
  let current = list.find((c) => c.id === id);
  while (current) {
    path.unshift(current);
    const parentId: string | null = current.parentId;
    current = parentId ? list.find((c) => c.id === parentId) : undefined;
  }
  return path;
}

export function getCategoryDepth(list: Category[], id: string) {
  return getCategoryPath(list, id).length;
}

export function getDescendantIds(list: Category[], id: string): string[] {
  const children = list.filter((c) => c.parentId === id);
  return children.flatMap((c) => [c.id, ...getDescendantIds(list, c.id)]);
}

export function hasChildren(list: Category[], id: string) {
  return list.some((c) => c.parentId === id);
}

/** A category can take sub-categories if it holds no products and is above the max depth. */
export function canHaveChildren(list: Category[], id: string) {
  const category = list.find((c) => c.id === id);
  return (
    !!category &&
    category.productCount === 0 &&
    getCategoryDepth(list, id) < MAX_CATEGORY_DEPTH
  );
}

export const formatCategoryPath = (path: Category[], sep = " › ") =>
  path.map((c) => c.name).join(sep);

/** Leaf categories are the only ones that accept products. */
export function getLeafCategories(list: Category[]) {
  return list.filter((c) => !hasChildren(list, c.id));
}

/**
 * Categories that may become the parent of `selfId`:
 * not itself or a descendant, not holding products, and not at max depth.
 */
export function getParentOptions(list: Category[], selfId?: string) {
  const blocked = new Set(
    selfId ? [selfId, ...getDescendantIds(list, selfId)] : [],
  );
  return list
    .filter(
      (c) =>
        !blocked.has(c.id) &&
        c.productCount === 0 &&
        getCategoryDepth(list, c.id) < MAX_CATEGORY_DEPTH,
    )
    .map((c) => ({
      id: c.id,
      label: formatCategoryPath(getCategoryPath(list, c.id)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
