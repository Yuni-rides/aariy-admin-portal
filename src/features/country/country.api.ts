import { http } from "@/shared/api/http";
import { CreateCityPayload, CreateCityResponse, CreateCountryDto, CreateCountryResponse, CreateProvinceDto, CreateProvinceResponse, DeleteCityResponse, DeleteCountryResponse, DeleteProvinceResponse, GetLocationsResponse, UpdateCityDto, UpdateCityResponse } from "./country.types";

export const locationsApi = {
getLocations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<GetLocationsResponse> => {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 10;

    const res = await http.get<GetLocationsResponse>("/admin/countries", {
      params: {
        page,
        limit,
        ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
      },
    });

    const raw = res.data;
    return {
      ...raw,
      data: {
        data: raw.data?.data ?? [],
        meta: {
          page: Number(raw.data?.meta?.page) || page,
          limit: Number(raw.data?.meta?.limit) || limit,
          total: Number(raw.data?.meta?.total) || 0,
        },
      },
    };
  },

  createCountry: async (
    payload: CreateCountryDto
  ): Promise<CreateCountryResponse> => {
    const res = await http.post<CreateCountryResponse>(
      "/admin/countries",
      payload
    );
        console.log(res)

    return res.data;
  },


  createProvince: async (
    payload: CreateProvinceDto
  ): Promise<CreateProvinceResponse> => {
    const res = await http.post<CreateProvinceResponse>(
      "/admin/countries",
      payload
    );
    return res.data;
  },


  createCity: async (
    payload: CreateCityPayload
  ): Promise<CreateCityResponse> => {
    const res = await http.post<CreateCityResponse>("/admin/countries", payload);
    return res.data;
  },


  deleteCountry: async (id: string): Promise<DeleteCountryResponse> => {
    const res = await http.delete<DeleteCountryResponse>(
      `/admin/countries/${id}`
    );
    return res.data;
  },


  deleteProvince: async (
    regionId: string
  ): Promise<DeleteProvinceResponse> => {
    const res = await http.delete<DeleteProvinceResponse>(
      `/admin/countries/${regionId}`
    );
    return res.data;
  },


  deleteCity: async (cityId: string): Promise<DeleteCityResponse> => {
    const res = await http.delete<DeleteCityResponse>(
      `/admin/countries/${cityId}`
    );
    return res.data;
  },


  updateCity: async (
    cityId: string,
    dto: UpdateCityDto
  ): Promise<UpdateCityResponse> => {
    const res = await http.patch<UpdateCityResponse>(
      `/admin/countries/${cityId}`,
      dto
    );
    return res.data;
  },
};




