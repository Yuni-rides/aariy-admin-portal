import { CityApiItem, CountryApiItem, CountryNode } from "./country.types";




export function mapCountriesToTree(items: CountryApiItem[]): CountryNode[] {
  return items.map((country) => ({
    id: country.id,
    code: country.code || country.countryCode || "",
    countryCode: country.countryCode || country.code || "",
    name: country.name,
    currency: country.currency,
    timezone: country.timezone,
    isActive: country.isActive ?? true,
    provinces: (country.provinces ?? []).map((prov) => ({
      id: prov.id,
      code: prov.code || "",
      name: prov.name,
      regionType: prov.regionType,
      sortOrder: prov.sortOrder,
      countryId: prov.countryId || country.id,
      cities: (prov.cities ?? []).map((city) => ({
        id: city.id,
        name: city.name,
        regionId: city.regionId || prov.id,
        countryId: city.countryId || country.id,
        isActive: city.isActive ?? true,
      })),
    })),
    cities: (country.cities ?? []).map((city) => ({
      id: city.id,
      name: city.name,
      regionId: city.regionId,
      countryId: city.countryId || country.id,
      isActive: city.isActive ?? true,
    })),
  }));
}