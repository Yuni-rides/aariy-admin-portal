import { create } from "zustand";
import {
    CityApiItem,
  CityNode,
  CountryApiItem,
  CountryNode,
  CreateCityDto,
  CreateCountryDto,
  CreateProvinceDto,
  PaginationMeta,
  ProvinceNode,
  UpdateCityDto,
  UpdateLocationDto,
} from "./country.types";
// import { MOCK_COUNTRIES } from "./country.mockdata";
import {  mapCountriesToTree } from "./country.helper";
import { locationsApi } from "./country.api";
import { tree } from "next/dist/build/templates/app-page";

type ActionResult = { success: boolean; message: string };

type LocationsState = {
rawItems: CountryApiItem[];
tree: CountryNode[];
 meta: PaginationMeta;
  loading: boolean;
  saving: boolean;
  error: string | null;

//   fetchCountries: () => Promise<void>;
  createCountry: (dto: CreateCountryDto) => Promise<ActionResult>;
  updateCountry: (id: string, dto: UpdateLocationDto) => Promise<ActionResult>;
  deleteCountry: (id: string) => Promise<ActionResult>;


  createProvince: (dto: CreateProvinceDto) => Promise<ActionResult>;
  updateProvince: (
    countryId: string,
    provinceId: string,
    dto: UpdateLocationDto
  ) => Promise<ActionResult>;
  deleteProvince: (countryId: string, provinceId: string) => Promise<ActionResult>;

  createCity: (dto: CreateCityDto) => Promise<ActionResult>;
  updateCity: (
    countryId: string,
    provinceId: string,
    cityId: string,
    dto: UpdateLocationDto
  ) => Promise<ActionResult>;
  deleteCity: (countryId: string,provinceId:string, cityId: string) => Promise<ActionResult>;


// ✅ Naya signature:
  fetchLocations: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => Promise<void>;
  setPage: (page: number) => Promise<void>;
};

export const useLocationsStore = create<LocationsState>((set, get) => ({
  rawItems: [],
  tree: [],
  
  meta: {
    page: 1,
    limit: 10,
    total: 0,
  },
  loading: false,
  saving: false,
  error: null,

  fetchLocations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const currentMeta = get().meta;
    const page = Number(params?.page) || currentMeta.page || 1;
    const limit = Number(params?.limit) || currentMeta.limit || 10;

    set({ loading: true, error: null });
    try {
      const res = await locationsApi.getLocations({
        page,
        limit,
        search: params?.search,
      });

      if (!res.status) {
        set({
          loading: false,
          error: res.message || "Failed to load locations",
        });
        return;
      }

      const items = res.data?.data ?? [];
      const apiMeta = res.data?.meta;

      set({
        rawItems: items,
        tree: mapCountriesToTree(items),
        meta: {
          page: Number(apiMeta?.page) || page,
          limit: Number(apiMeta?.limit) || limit,
          total: Number(apiMeta?.total) ?? items.length,
        },
        loading: false,
      });
    } catch (e: unknown) {
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to load locations";

      set({ loading: false, error: message });
    }
  },

  setPage: async (page: number) => {
    await get().fetchLocations({
      page,
      limit: get().meta.limit,
    });
  },

  // setPage: async (page: number) => {
  //   await get().fetchLocations(page, get().meta.limit);
  // },

  createCountry: async (dto:CreateCountryDto) => {
console.log(dto,"[[]]");
const payload: CreateCountryDto = {
    name: typeof dto?.name === "string" ? dto.name.trim() : "",
    // countryCode:
    //   typeof dto?.countryCode === "string"
    //     ? dto.countryCode.trim().toUpperCase()
    //     : "",
    // currency:
    //   typeof dto?.currency === "string"
    //     ? dto.currency.trim().toUpperCase()
    //     : "",
    // timezone: typeof dto?.timezone === "string" ? dto.timezone.trim() : "",
  };
    console.log(payload)

  if (
    !payload.name 
    // ||
    // !payload.countryCode ||
    // !payload.currency ||
    // !payload.timezone
  ) {

    console.log(payload)
    return { success: false, message: "All country fields are required" };
  }


    const trimmed = dto.name.trim();
    if (!trimmed) return { success: false, message: "Country name is required" };

    const exists = get().tree.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { success: false, message: "Country already exists" };
    }



    set({ saving: true });


    try {
        const res = await locationsApi.createCountry(payload);

            console.log(res)

        if (!res.status) {
      set({ saving: false });
      return {
        success: false,
        message: res.message || "Failed to create country",
      };


    }

      // Agar backend created country data bheje to tree mein add karein (duplicate avoid karke)
    if (res.data) {
   const created = res.data;
        const newCountry: CountryNode = {
          id: created.id,
          code: created.countryCode  || "",
          countryCode: created.countryCode  || "",
          name: created.name,
          currency: created.currency ,
          timezone: created.timezone ,
          isActive: created.isActive ?? true,
          provinces: [],
          cities: [],
        };

        set((state) => {
          const exists = state.tree.some((c) => c.id === newCountry.id);
          return {
            tree: exists ? state.tree : [...state.tree, newCountry],
            meta: {
              ...state.meta,
              total: exists ? state.meta.total : state.meta.total + 1,
            },
            saving: false,
          };
        });
    } else {
      set({ saving: false });
    
    
    }

    return {
      success: true,
      message: res.message || "Country created",
    };
    } catch (e:unknown) {
  set({ saving: false });
    const message =
      (e as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? "Failed to create country";
    return { success: false, message };
  }

  },

  updateCountry: async (id, dto) => {
    set({ saving: true });
    // TODO(api): await locationsApi.updateCountry(id, dto)
    set((state) => ({
      countries: state.tree.map((c) =>
        c.id === id
          ? {
              ...c,
              ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
              ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            }
          : c
      ),
      saving: false,
    }));

    return { success: true, message: "Country updated" };
  },

  deleteCountry: async (id) => {
    const target = get().tree.find((c) => c.id === id);
    if (!target) return { success: false, message: "Country not found" };
    
    if (target.provinces.length > 0) {
      return {
        success: false,
        message: "Remove all cities before deleting this country",
      };
    }

    set({ saving: true });

try{
  const res = await locationsApi.deleteCountry(id);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to delete country",
        };
      }
const deletedId = res.data?.id ?? id;

      set((state) => ({
        tree: state.tree.filter((c) => c.id !== deletedId),
        rawItems: state.rawItems.filter((item) => item.id !== deletedId),
        meta: {
          ...state.meta,
          total: Math.max(0, state.meta.total - 1),
        },
        saving: false,
      }));

      return { success: true, message: res.message || "Country deleted" };
    } catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to delete country";

      return { success: false, message };
    }
 
  },




  // ---------------- PROVINCE ----------------
 createProvince: async (dto: CreateProvinceDto) => {
    const name = typeof dto?.name === "string" ? dto.name.trim() : "";
    if (!dto?.countryId || !name) {
      return {
        success: false,
        message: "Country and province name are required",
      };
    }

    const country = get().tree.find((c) => c.id === dto.countryId);
    if (!country) return { success: false, message: "Country not found" };

    const duplicate = country.provinces.some(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return {
        success: false,
        message: `Province already exists in ${country.name}`,
      };
    }

    const code =
      typeof dto?.code === "string" ? dto.code.trim().toUpperCase() : "";

    const payload: CreateProvinceDto = {
      countryId: dto.countryId,
      name,
      ...(code ? { code } : {}),
      ...(dto.type ? { type: dto.type } : {}),
    };

    set({ saving: true });
    try {
      const res = await locationsApi.createProvince(payload);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to create province",
        };
      }

    const created = res.data;
      const newProvince: ProvinceNode = {
        id: created?.id ?? `province-${Date.now()}`,
        code: created?.code ?? code,
        name: created?.name ?? name,
        regionType: created?.type ?? dto.type ?? "PROVINCE",
        countryId: payload.countryId,
        cities: [],
      };

      set((state) => ({
        tree: state.tree.map((c) => {
          if (c.id !== payload.countryId) return c;
          const exists = c.provinces.some((p) => p.id === newProvince.id);
          return exists
            ? c
            : { ...c, provinces: [...c.provinces, newProvince] };
        }),
        saving: false,
      }));

      return { success: true, message: res.message || "Province created" };
    } catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to create province";

      return { success: false, message };
    }
  },

  updateProvince: async (countryId, provinceId, dto) => {
    set({ saving: true });
    // TODO(api): await locationsApi.updateProvince(provinceId, dto)
    set((state) => ({
      tree: state.tree.map((c) =>
        c.id === countryId
          ? {
              ...c,
              provinces: c.provinces.map((p) =>
                p.id === provinceId
                  ? {
                      ...p,
                      ...(dto.name !== undefined
                        ? { name: dto.name.trim() }
                        : {}),
                      ...(dto.code !== undefined
                        ? { code: dto.code.trim().toUpperCase() }
                        : {}),
                    }
                  : p
              ),
            }
          : c
      ),
      saving: false,
    }));

    return { success: true, message: "Province updated" };
  },

 deleteProvince: async (countryId: string, provinceId: string) => {
    const country = get().tree.find((c) => c.id === countryId);
    const province = country?.provinces.find((p) => p.id === provinceId);

    if (!country || !province) {
      return { success: false, message: "Province not found" };
    }
    if (province.cities.length > 0) {
      return {
        success: false,
        message: "Remove all cities before deleting this province",
      };
    }

    set({ saving: true });
    try {
      const res = await locationsApi.deleteProvince(provinceId);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to delete province",
        };
      }

      const deletedId = res.data?.id ?? provinceId;

      set((state) => ({
        tree: state.tree.map((c) =>
          c.id !== countryId
            ? c
            : {
                ...c,
                provinces: c.provinces.filter((p) => p.id !== deletedId),
              }
        ),
        saving: false,
      }));

      return {
        success: true,
        message: res.message || "Province deleted",
      };
    } catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to delete province";

      return { success: false, message };
    }
  },


  // ---------------- CITY ----------------

  createCity: async (dto:CreateCityDto) => {
    const trimmed = dto.name.trim();
    if (!trimmed) return { success: false, message: "City name is required" };
if (!dto.provinceId) {
      return { success: false, message: "Region / Province ID is required" };
    }




    set({ saving: true });

try {
      const res = await locationsApi.createCity({
        regionId: dto.provinceId,
        name: trimmed,
      });
if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to create city",
        };
      }

    const created = res.data;
      const targetCountryId = created?.countryId ?? dto.countryId;
      const targetProvinceId = created?.regionId ?? dto.provinceId;

      const newCity: CityNode = {
        id: created?.id ?? `city-${Date.now()}`,
        name: created?.name ?? trimmed,
        regionId: targetProvinceId,
        countryId: targetCountryId,
        isActive: created?.isActive ?? true,
      };

      set((state) => ({
        tree: state.tree.map((c) => {
          if (c.id !== targetCountryId) return c;
          return {
            ...c,
            provinces: c.provinces.map((p) => {
              if (p.id !== targetProvinceId) return p;
              const exists = p.cities.some((city) => city.id === newCity.id);
              return exists ? p : { ...p, cities: [...p.cities, newCity] };
            }),
          };
        }),
        saving: false,
      }));

      return { success: true, message: res.message || "City created" };

    }catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to create city";

      return { success: false, message };
    }



  },

 updateCity: async (countryId, provinceId, cityId, data) => {
    const trimmedName =
      typeof data.name === "string" ? data.name.trim() : undefined;

    if (data.name !== undefined && !trimmedName) {
      return { success: false, message: "City name is required" };
    }

    const payload: UpdateCityDto = {
      ...(trimmedName !== undefined ? { name: trimmedName } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    };

    set({ saving: true });
    try {
      const res = await locationsApi.updateCity(cityId, payload);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to update city",
        };
      }

      const updated = res.data;

      set((state) => ({
        tree: state.tree.map((c) => {
          if (c.id !== countryId) return c;

          return {
            ...c,
            // 1. Direct cities under country (agar provinceId empty ho)
            cities: (c.cities ?? []).map((city) =>
              city.id === cityId
                ? {
                    ...city,
                    ...(updated?.name ?? trimmedName
                      ? { name: updated?.name ?? trimmedName! }
                      : {}),
                    ...(updated?.isActive !== undefined ||
                    data.isActive !== undefined
                      ? { isActive: updated?.isActive ?? data.isActive! }
                      : {}),
                  }
                : city
            ),
            // 2. Nested cities under provinces
            provinces: c.provinces.map((p) =>
              provinceId && p.id !== provinceId
                ? p
                : {
                    ...p,
                    cities: p.cities.map((city) =>
                      city.id === cityId
                        ? {
                            ...city,
                            ...(updated?.name ?? trimmedName
                              ? { name: updated?.name ?? trimmedName! }
                              : {}),
                            ...(updated?.isActive !== undefined ||
                            data.isActive !== undefined
                              ? {
                                  isActive:
                                    updated?.isActive ?? data.isActive!,
                                }
                              : {}),
                          }
                        : city
                    ),
                  }
            ),
          };
        }),
        saving: false,
      }));

      return { success: true, message: res.message || "City updated" };
    } catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;
      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to update city";
      return { success: false, message };
    }
  },


deleteCity: async (
    countryId: string,
    provinceId: string,
    cityId: string
  ) => {
    const country = get().tree.find((c) => c.id === countryId);
    const province = country?.provinces.find((p) => p.id === provinceId);
    const city = province?.cities.find((ct) => ct.id === cityId);

    if (!country || !province || !city) {
      return { success: false, message: "City not found" };
    }

    set({ saving: true });
    try {
      const res = await locationsApi.deleteCity(cityId);

      if (!res.status) {
        set({ saving: false });
        return {
          success: false,
          message: res.message || "Failed to delete city",
        };
      }

      const deletedId = res.data?.id ?? cityId;

      set((state) => ({
        tree: state.tree.map((c) =>
          c.id !== countryId
            ? c
            : {
                ...c,
                provinces: c.provinces.map((p) =>
                  p.id !== provinceId
                    ? p
                    : {
                        ...p,
                        cities: p.cities.filter((ct) => ct.id !== deletedId),
                      }
                ),
              }
        ),
        saving: false,
      }));

      return {
        success: true,
        message: res.message || "City deleted",
      };
    } catch (e: unknown) {
      set({ saving: false });
      const errData = (
        e as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data;

      const message = Array.isArray(errData?.message)
        ? errData.message.join(", ")
        : errData?.message ?? "Failed to delete city";

      return { success: false, message };
    }
  },

}));