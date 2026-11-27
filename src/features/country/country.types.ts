export type RegionType = "PROVINCE" | "STATE" | "EMIRATE" | "TERRITORY";

export type CityApiItem = {
  id: string;
  type?: string;
  name: string;
  isActive: boolean;
  countryId: string;
  regionId: string;
};

export type ProvinceApiItem = {
  id: string;
  type?: string;
  code: string;
  name: string;
  regionType?: RegionType | string;
  sortOrder?: number;
  countryId: string;
  cities: CityApiItem[];
};

export type CountryApiItem = {
  id: string;
  type?: string;
  code: string;
  countryCode: string;
  name: string;
  currency?: string;
  timezone?: string;
  defaultLocale?: string;
  isActive: boolean;
  isAcceptingOrders?: boolean;
  provinces: ProvinceApiItem[];
  cities: CityApiItem[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};
export type GetLocationsResponse = {
  status: boolean;
  code: string;
  message: string;
  data: {
    data: CountryApiItem[];
    meta: PaginationMeta;
  };
};

// UI Tree ke liye grouped structures (Country -> Province/Region -> City)
// UI Tree Nodes
export type CityNode = {
  id: string;
  name: string;
  regionId: string;
  countryId: string;
  isActive: boolean;
};
export type ProvinceNode = {
  id: string;
  code: string;
  name: string;
  regionType?: string;
  sortOrder?: number;
  countryId: string;
  cities: CityNode[];
};

export type CountryNode = {
  id: string;
  code: string;
  countryCode: string;
  name: string;
  currency?: string;
  timezone?: string;
  isActive: boolean;
  provinces: ProvinceNode[];
  cities: CityNode[];
};
// Selection & Editor Mode (3 Levels)
export type SelectedLocation =
  | { type: "country"; id: string }
  | { type: "province"; id: string; countryId: string }
  | { type: "city"; id: string; provinceId: string; countryId: string };

export type EditorMode =
  | { type: "create-country" }
  | { type: "create-province"; countryId: string }
  | { type: "create-city"; countryId: string; provinceId: string }
  | { type: "edit-country"; id: string }
  | { type: "edit-province"; id: string; countryId: string }
  | { type: "edit-city"; id: string; provinceId: string; countryId: string }
  | null;








export type UpdateLocationDto = {
  name?: string;
  code?: string;
  isActive?: boolean;
};



export type CreateCountryDto = {
name: string;
  countryCode?: string;
  currency?: string;
  timezone?: string;
};

export type CreateCountryResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    name: string;
    countryCode: string;
    currency: string;
    timezone: string;
    isActive?: boolean;
  };
};





export type CreateProvinceDto = {
  countryId: string;
  name: string;
  code?: string;
type?: RegionType | null;
};

export type CreateProvinceResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    countryId: string;
    name: string;
    code: string;
    type?: string;
    isActive?: boolean;
  };
};


export type CreateCityDto = {
  countryId: string; // Tree mein locate karne ke liye (API payload mein nahi jayega)
  provinceId: string; // API mein regionId ban kar jayega
  name: string;
};

export type CreateCityPayload = {
  regionId: string;
  name: string;
};

export type CreateCityResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: CityApiItem;
};




export type DeleteCountryResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    deleted: boolean;
  };
};

export type DeleteProvinceResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    deleted: boolean;
  };
};


export type DeleteCityResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    deleted: boolean;
  };
};


export type UpdateCityDto = {
  name?: string;
  isActive?: boolean;
};


export type UpdateProviceOrCountry = {
  name?: string;
};
export type UpdateCityResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    id: string;
    name: string;
    countryId?: string;
    regionId?: string;
    isActive?: boolean;
  };
};