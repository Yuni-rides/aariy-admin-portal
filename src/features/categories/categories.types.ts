export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl?: string | null;
  showInMenu: boolean;
  isActive: boolean;
  /** Curated categories are indexed by search engines. */
  isCurated: boolean;
  sortOrder: number;
  productCount: number;
};

export type CategoryNode = Category & {
  depth: number;
  children: CategoryNode[];
};

export type CreateCategoryDto = {
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl?: string | null;
  showInMenu: boolean;
  isActive: boolean;
  isCurated: boolean;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export type CategoryResponse = {
  status: boolean;
  message: string;
  data?: { id: string };
};

export type GetCategoriesResponse = {
  status: boolean;
  message: string;
  data?: Category[];
};
