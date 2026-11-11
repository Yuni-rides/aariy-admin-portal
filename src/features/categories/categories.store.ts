import { create } from "zustand";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./categories.types";
import { CATEGORIES_MOCK } from "./categories.mock";
import { getSiblings, hasChildren } from "./categories.helpers";

type Result = { success: boolean; message: string };

type CategoriesStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  categories: Category[];

  fetchCategories: () => Promise<void>;
  createCategory: (dto: CreateCategoryDto) => Promise<Result & { id?: string }>;
  updateCategory: (id: string, dto: UpdateCategoryDto) => Promise<Result>;
  deleteCategory: (id: string) => Promise<Result>;
  reorderSiblings: (orderedIds: string[]) => Promise<Result>;
};

const slugTaken = (
  list: Category[],
  slug: string,
  parentId: string | null,
  selfId?: string,
) =>
  list.some(
    (c) => c.slug === slug && c.parentId === parentId && c.id !== selfId,
  );

export const useCategoriesStore = create<CategoriesStore>((set, get) => ({
  loading: false,
  saving: false,
  error: null,
  categories: [],

  fetchCategories: async () => {
    // Keep local edits while the store is mock-backed.
    if (get().categories.length > 0) return;
    set({ loading: true, error: null });
    try {
      // TODO(api): const res = await categoriesApi.getCategories();
      set({ categories: CATEGORIES_MOCK, loading: false });
    } catch (e: any) {
      const message = e?.response?.data?.message ?? "Something went wrong";
      set({ error: message, loading: false });
    }
  },

  createCategory: async (dto) => {
    const { categories } = get();
    if (slugTaken(categories, dto.slug, dto.parentId)) {
      return { success: false, message: "Slug already used under this parent" };
    }
    const parent = categories.find((c) => c.id === dto.parentId);
    if (parent && parent.productCount > 0) {
      return {
        success: false,
        message: `${parent.name} has products, so it cannot have sub-categories`,
      };
    }

    set({ saving: true });
    // TODO(api): const res = await categoriesApi.createCategory(dto);
    const id = `cat-${Date.now()}`;
    const sortOrder = getSiblings(categories, dto.parentId).length + 1;
    set({
      categories: [...categories, { ...dto, id, sortOrder, productCount: 0 }],
      saving: false,
    });
    return { success: true, message: "Category created", id };
  },

  updateCategory: async (id, dto) => {
    const { categories } = get();
    const current = categories.find((c) => c.id === id);
    if (!current) return { success: false, message: "Category not found" };

    const parentId =
      dto.parentId !== undefined ? dto.parentId : current.parentId;
    const slug = dto.slug ?? current.slug;
    if (slugTaken(categories, slug, parentId, id)) {
      return { success: false, message: "Slug already used under this parent" };
    }

    set({ saving: true });
    // TODO(api): const res = await categoriesApi.updateCategory(id, dto);
    const moved = parentId !== current.parentId;
    set({
      categories: categories.map((c) =>
        c.id === id
          ? {
              ...c,
              ...dto,
              sortOrder: moved
                ? getSiblings(categories, parentId).length + 1
                : c.sortOrder,
            }
          : c,
      ),
      saving: false,
    });
    return { success: true, message: "Changes saved" };
  },

  deleteCategory: async (id) => {
    const { categories } = get();
    const current = categories.find((c) => c.id === id);
    if (!current) return { success: false, message: "Category not found" };
    if (current.productCount > 0) {
      return {
        success: false,
        message: "A category with products can be hidden, not deleted",
      };
    }
    if (hasChildren(categories, id)) {
      return {
        success: false,
        message: "Remove or move its sub-categories first",
      };
    }

    // TODO(api): const res = await categoriesApi.deleteCategory(id);
    set({ categories: categories.filter((c) => c.id !== id) });
    return { success: true, message: `${current.name} deleted` };
  },

  reorderSiblings: async (orderedIds) => {
    // TODO(api): const res = await categoriesApi.reorder(orderedIds);
    set((state) => ({
      categories: state.categories.map((c) => {
        const index = orderedIds.indexOf(c.id);
        return index === -1 ? c : { ...c, sortOrder: index + 1 };
      }),
    }));
    return { success: true, message: "Order updated" };
  },
}));
