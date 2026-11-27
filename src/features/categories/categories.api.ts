import { http } from "@/shared/api/http";
import { ActiveInActiceCategoryResponse, CreateCategoryDto, CreateParentCategoryResponse, DeleteCategoryResponse, GetCategoriesResponse, UpdateCategoryDto } from "./categories.types";


export const categoryApi = {
  getCategories: async (

     page = 1,
    limit = 10,
parentId?: string | null
  ): Promise<GetCategoriesResponse> => {
      const params = new URLSearchParams();

    params.append("page", String(page));
    params.append("limit", String(limit));

   // 2. Checks for both null AND undefined (and empty string)
    if (parentId) {
      params.append("parentId", parentId);
    }

const res = await http.get<GetCategoriesResponse>(`/admin/categories?${params.toString()}`);

    console.log(res.data,"[Get Categories]")
    return res.data;
  },


  createCategory: async (payload: CreateCategoryDto): Promise<CreateParentCategoryResponse> => {
    const res = await http.post<CreateParentCategoryResponse>("admin/categories", payload);

    console.log( "[create category Payload",res.data)
    return res.data;
  },


    deleteCategory: async (
      categoryId: string 

    ): Promise<DeleteCategoryResponse> => {
    const res = await http.delete<DeleteCategoryResponse>(`/admin/categories/${categoryId.toString()}`,
  
  
  );

    console.log(res.data)
    return res.data;
  },




   activeCategory : async (
      categoryId: string,
      isActive:boolean

    ): Promise<ActiveInActiceCategoryResponse> => {
    const res = await http.patch<ActiveInActiceCategoryResponse>(`/admin/categories/${categoryId.toString()}/status`,
  {
  "isActive": isActive
}
  );

    console.log(res.data)
    return res.data;
  },




  updateCategory: async (
    categoryId:string,
    payload: UpdateCategoryDto): Promise<CreateParentCategoryResponse> => {
          console.log("Edit Category Payload",payload);

    const res = await http.patch<CreateParentCategoryResponse>(`admin/categories/${categoryId.toString()}`, payload);

    console.log(res.data)
    return res.data;
  },



}