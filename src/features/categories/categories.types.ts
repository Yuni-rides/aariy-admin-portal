


export type CategoryField = {
  id: string;
  code: string;
  name: string;
  type: CategoryFieldType;
  options: string[] | null;
  unit: string | null;
  isRequired: boolean;
  isVariant: boolean;
  isFilterable: boolean;
  sortOrder: number;
  isActive: boolean;
};
export type Category = {


   id: string;
     parentId: string | null;
parent: string | CategoryParentRef | null; // <-- String aur Object dono safe
  name: string;
  slug: string;
                  path: string;
                  depth:number | 0;
                  isParent :boolean;
                  market: string;
                   sortOrder: number;
                     isActive: boolean;
isIndexable:boolean | null;
image?:string | null;
                imageKey: string | null;
                childrenCount :number ;
  productCount: number;
createdAt? : Date | null
updatedAt? :Date | null
  imageUrl?: string | null;
  showInMenu: boolean;


  
  /** Curated categories are indexed by search engines. */
  isCurated: boolean;


  breadcrumb?: CategoryBreadcrumbItem[];
  children?: Category[];
  fields?: CategoryField[];
};


export type CategoryNode = Category & {
  depth: number;
  children: CategoryNode[];
};


export type CategoryParentRef = {
  id: string;
  name: string;
};

export type CategoryBreadcrumbItem = {
  id: string;
  name: string;
  slug: string;
};

// export type CreateCategoryDto = {
//   name: string;
//   slug: string;
//   parentId: string | null;
//   imageUrl?: string | null;
//   showInMenu: boolean;
//   isActive: boolean;
//   isCurated: boolean;
//   /** Position among its siblings, 1 = first. The others move down to make room. */
//   sortOrder: number;
// };

export type UpdateCategoryDto = Partial<CreateCategoryDto>;



export type CategoryResponse = {
  status: boolean;
  message: string;
  data?: { id: string };
};





export type GetCategoriesResponse = {
  status: boolean;
  code:string;
  message: string;
 data: {
    data: Category[];
        meta: PaginationMeta;
    
 }
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};
export type CreateParentCategoryResponse = {
  status: boolean;
  code:string;
  message: string;

  data?: Category;
};
export type CategoryFieldType =
  | "TEXT"
  | "NUMBER"
  | "DROPDOWN"
  | "MULTI_SELECT"
  | "BOOLEAN";

export type CategoryFieldPayload = {
  name: string;
  type: CategoryFieldType;
  options?: string[];
  isRequired?: boolean;
  isVariant?: boolean;
  isFilterable?: boolean;
};

export type CreateCategoryDto = {
  name: string;
  slug?: string | null;
  imageKey?: string | null;
  /** Frontend-only field (form se page tak file pass karne ke liye) */
  file?: File | null;
  parentId?: string | null;
  /** Position among its siblings, 1 = first. The others move down to make room. */
  sortOrder: number;
  showInMenu?: boolean | null;
  isActive?: boolean | null;
  isCurated?: boolean | null;
  fields?: CategoryFieldPayload[];
};

export type DeleteCategoryResponse = {
  status: boolean;
  code:string;
  message: string;
  data?: { id: string,deleted:boolean };
};




export type ActiveInActiceCategoryResponse = {
  status: boolean;
  code:string;
  message: string;

};


