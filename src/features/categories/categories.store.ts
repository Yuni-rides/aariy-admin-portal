import { create } from "zustand";
import {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "./categories.types";
// import { CATEGORIES_MOCK } from "./categories.mock";
import { findCategoryRecursive, hasChildren, hasChildrenRecursive, placeInSiblings, removeCategoryRecursive, renumberSiblings, replaceCategoryRecursive } from "./categories.helpers";
import { categoryApi } from "./categories.api";
import { PaginationMeta } from "../country/country.types";

type Result = { success: boolean; message: string };

type CategoriesStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  categories: Category[];
   meta: PaginationMeta;
  

  fetchCategories: (

    params?: {
    page?: number;
    limit?: number;
    force?: boolean;
  }
  ) => Promise<void>;
  createCategory: (dto: CreateCategoryDto) => Promise<Result & { id?: string }>;
  updateCategory: (id: string, dto: UpdateCategoryDto) => Promise<Result>;
  deleteCategory: (id: string) => Promise<Result>;
  reorderSiblings: (orderedIds: string[]) => Promise<Result>;

  setPage: (page: number) => Promise<void>;

  // 1. CategoriesState interface mein add karein:
toggleCategoryStatus: (
  id: string,
  isActive: boolean
) => Promise<{ success: boolean; message: string }>;
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
 meta: {
    page: 1,
    limit: 10,
    total: 0,
  },
  fetchCategories: async (
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    force?: boolean;
  },
) => {
  const currentMeta = get().meta;
  const page = Number(params?.page) || currentMeta.page || 1;
  const limit = Number(params?.limit) || currentMeta.limit || 10;

  // Sirf tab skip karein jab initial/cached state ho aur force na ho
  if (!params?.force && get().categories.length > 0 && page === currentMeta.page) {
    return;
  }

  set({ loading: true, error: null });
  try {
    const res = await categoryApi.getCategories(page, limit);

    const rawList = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
          ? res.data.data
          : [];

   const apiMeta =
  (res as any)?.data?.meta ??
  (res as any)?.meta ??
  (res as any)?.data?.data?.meta ??
  {};

    set({
      categories: rawList,
      meta: {
        page: Number(apiMeta.page) || page,
        limit: Number(apiMeta.limit) || limit,
        total:
          typeof apiMeta.total === "number"
            ? apiMeta.total
            : rawList.length,
      },
      loading: false,
    });
  } catch (e: any) {
    const message = e?.response?.data?.message ?? "Something went wrong";
    set({ error: message, loading: false });
  }
},

setPage: async (page: number) => {
  await get().fetchCategories({
    page,
    limit: get().meta.limit,
    force: true,
  });
},
  createCategory: async (dto) => {
    const { categories } = get();
   // 1. Frontend Validations (jo pehle se likhi hain)
  if (dto.slug && slugTaken(categories, dto.slug, dto.parentId ?? null)) {
    return { success: false, message: "Slug already used under this parent" };
  }
    const parent = categories.find((c) => c.id === dto.parentId);
    if (parent && parent.productCount > 0) {
      return {
        success: false,
        message: `${parent.name} has products, so it cannot have sub-categories`,
      };
    }

    if (!Number.isInteger(dto.sortOrder) || dto.sortOrder < 1) {
      return { success: false, message: "Sort order must be a whole number from 1" };
    }

    set({ saving: true });




try {
  // Clean payload (agar slug ya parentId empty string ho to null bhejein)
    const payload: CreateCategoryDto = {
      name: dto.name,
      slug: dto.slug || null,
      imageKey: dto.imageKey || null,
      parentId: dto.parentId || null,
      sortOrder: dto.sortOrder,
    };

    const res = await categoryApi.createCategory(payload);
    const createdCategory = res.data;

    if (!createdCategory) {
      set({ saving: false });
      return {
        success: false,
        message: res.message || "Failed to create category",
      };
    }

    // 3. Local state mein nayi category add karein aur siblings reorder karein
    const withNew = [...categories, createdCategory];

    set({
      categories: placeInSiblings(
        withNew,
        createdCategory.id,
        createdCategory.parentId ?? null,
        createdCategory.sortOrder,
        createdCategory.imageKey ?? null
      ),
      saving: false,
    });

    return {
      success: true,
      message: res.message || "Category created",
      id: createdCategory.id,
    };
} catch (e:any) {
  set({ saving: false });
    const message =
      e?.response?.data?.message ?? "Failed to create category";
    return { success: false, message };
}



    // // TODO(api): const res = await categoriesApi.createCategory(dto); — dto includes sortOrder.
    // const id = `cat-${Date.now()}`;
    // // const withNew = [...categories, { ...dto, id, productCount: 0 }];
    // // set({
    // //   categories: placeInSiblings(withNew, id, dto.parentId, dto.sortOrder),
    // //   saving: false,
    // // });
    // return { success: true, message: "Category created", id };
  },
updateCategory: async (id: string, dto: UpdateCategoryDto) => {
  const { categories } = get();
  const current = findCategoryRecursive(categories, id);
  if (!current) return { success: false, message: "Category not found" };

  const parentId =
    dto.parentId !== undefined ? dto.parentId : current.parentId;
  const slug = dto.slug ?? current.slug;

  if (slugTaken(categories, slug, parentId, id)) {
    return { success: false, message: "Slug already used under this parent" };
  }

  if (
    dto.sortOrder !== undefined &&
    (!Number.isInteger(dto.sortOrder) || dto.sortOrder < 1)
  ) {
    return {
      success: false,
      message: "Sort order must be a whole number from 1",
    };
  }

  set({ saving: true });
  try {
    const res = await categoryApi.updateCategory(id, dto);

    if (!res.status) {
      set({ saving: false });
      return {
        success: false,
        message: res.message || "Failed to update category",
      };
    }

    const updatedItem: Category = res.data
      ? {
          ...current,
          ...res.data,
          parentId: res.data.parentId ?? null,
        }
      : {
          ...current,
          name: dto.name ?? current.name,
          slug: dto.slug ?? current.slug,
          parentId,
          imageKey:
            dto.imageKey !== undefined ? dto.imageKey : current.imageKey,
          sortOrder: dto.sortOrder ?? current.sortOrder,
          isActive: dto.isActive ?? current.isActive,
        };

    const moved = parentId !== current.parentId;
    let next = replaceCategoryRecursive(categories, id, () => updatedItem);

    if (moved) {
      next = renumberSiblings(next, current.parentId);
    }

    next = placeInSiblings(
      next,
      id,
      parentId,
      updatedItem.sortOrder ??
        (moved ? Number.MAX_SAFE_INTEGER : current.sortOrder),
    );

    set({ categories: next, saving: false });

    return {
      success: true,
      message: res.message || "Changes saved",
    };
  } catch (e: unknown) {
    set({ saving: false });
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Failed to update category";
    return { success: false, message };
  }
},
 deleteCategory: async (id) => {
  const { categories } = get();
  const current = findCategoryRecursive(categories, id);
  if (!current) return { success: false, message: "Category not found" };

  if (current.productCount > 0) {
    return {
      success: false,
      message: "A category with products can be hidden, not deleted",
    };
  }

  if (hasChildrenRecursive(categories, id, hasChildren)) {
    return {
      success: false,
      message: "Remove or move its sub-categories first",
    };
  }

  set({ saving: true });
  try {
    await categoryApi.deleteCategory(id); // DELETE /admin/categories/:id

    set({
      categories: removeCategoryRecursive(categories, id),
      saving: false,
    });
    return { success: true, message: `${current.name} deleted` };
  } catch (e: any) {
    set({ saving: false });
    const message =
      e?.response?.data?.message ?? "Failed to delete category";
    return { success: false, message };
  }
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






// 2. Store ke actions mein add karein:
toggleCategoryStatus: async (id: string, isActive: boolean) => {
  set({ saving: true });
  try {
    const res = await categoryApi.activeCategory(id, isActive);

    if (!res.status) {
      set({ saving: false });
      return {
        success: false,
        message: res.message || "Failed to update status",
      };
    }

    // Local state mein sirf us category ka isActive update karein
    set((state) => ({
      categories: state.categories.map((cat) =>
        cat.id === id ? { ...cat, isActive } : cat
      ),
      saving: false,
    }));

    return {
      success: true,
      message: res.message || `Category ${isActive ? "activated" : "deactivated"}`,
    };
  } catch (e: unknown) {
    set({ saving: false });
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Failed to update category status";
    return { success: false, message };
  }
},



}));
