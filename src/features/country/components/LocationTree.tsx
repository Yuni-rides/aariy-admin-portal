"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountryNode, SelectedLocation } from "../country.types";

type LocationTreeProps = {
  countries: CountryNode[];
  selected: SelectedLocation | null;
  onSelectCountry: (countryId: string) => void;
  onSelectProvince: (countryId: string, provinceId: string) => void;
  onSelectCity: (countryId: string, provinceId: string, cityId: string) => void;
  onAddProvince: (countryId: string) => void;
  onAddCity: (countryId: string, provinceId: string) => void;
};

export function LocationTree({
  countries,
  selected,
  onSelectCountry,
  onSelectProvince,
  onSelectCity,
  onAddProvince,
  onAddCity,
}: LocationTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  if (countries.length === 0) {
    return <p className="text-sm text-muted-foreground">No locations found.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {countries.map((country) => {
        const countryKey = `country-${country.id}`;
        const isCountryOpen = !collapsed.has(countryKey);
        const hasProvinces = country.provinces.length > 0;
        const isCountrySelected =
          selected?.type === "country" && selected.id === country.id;

        return (
          <li key={country.id}>
            {/* LEVEL 1: COUNTRY */}
            <div
              className={cn(
                "group flex items-center gap-1 rounded-[10px] pr-1.5 text-sm",
                isCountrySelected ? "bg-accent font-semibold" : "hover:bg-muted"
              )}
              style={{ paddingLeft: 4 }}
            >
              {hasProvinces ? (
                <button
                  type="button"
                  aria-label={
                    isCountryOpen
                      ? `Collapse ${country.name}`
                      : `Expand ${country.name}`
                  }
                  className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  onClick={() => toggle(countryKey)}
                >
                  {isCountryOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-7 shrink-0" />
              )}

              <button
                type="button"
                className="flex-1 cursor-pointer truncate py-2.5 text-left"
                onClick={() => onSelectCountry(country.id)}
              >
                {country.name}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({country.code})
                </span>
              </button>

              <button
                type="button"
                title={`Add province under ${country.name}`}
                className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-60 hover:bg-white hover:text-primary hover:opacity-100 group-hover:opacity-100"
                onClick={() => {
                  if (hasProvinces && !isCountryOpen) toggle(countryKey);
                  onAddProvince(country.id);
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* LEVEL 2: PROVINCES (REGIONS) */}
            {hasProvinces && isCountryOpen && (
              <ul className="mt-0.5 space-y-0.5">
                {country.provinces.map((province) => {
                  const provinceKey = `province-${province.id}`;
                  const isProvinceOpen = !collapsed.has(provinceKey);
                  const hasCities = province.cities.length > 0;
                  const isProvinceSelected =
                    selected?.type === "province" && selected.id === province.id;

                  return (
                    <li key={province.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-1 rounded-[10px] pr-1.5 text-sm",
                          isProvinceSelected
                            ? "bg-accent font-semibold"
                            : "hover:bg-muted"
                        )}
                        style={{ paddingLeft: 24 }}
                      >
                        {hasCities ? (
                          <button
                            type="button"
                            aria-label={
                              isProvinceOpen
                                ? `Collapse ${province.name}`
                                : `Expand ${province.name}`
                            }
                            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground hover:text-foreground"
                            onClick={() => toggle(provinceKey)}
                          >
                            {isProvinceOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-7 shrink-0" />
                        )}

                        <button
                          type="button"
                          className="flex-1 cursor-pointer truncate py-2.5 text-left"
                          onClick={() =>
                            onSelectProvince(country.id, province.id)
                          }
                        >
                          {province.name}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({province.code})
                          </span>
                        </button>

                        {hasCities && (
                          <span
                            className="px-1.5 text-xs text-muted-foreground"
                            title="Cities"
                          >
                            {province.cities.length}
                          </span>
                        )}

                        <button
                          type="button"
                          title={`Add city under ${province.name}`}
                          className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-60 hover:bg-white hover:text-primary hover:opacity-100 group-hover:opacity-100"
                          onClick={() => {
                            if (hasCities && !isProvinceOpen)
                              toggle(provinceKey);
                            onAddCity(country.id, province.id);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* LEVEL 3: CITIES */}
                      {hasCities && isProvinceOpen && (
                        <ul className="mt-0.5 space-y-0.5">
                          {province.cities.map((city) => {
                            const isCitySelected =
                              selected?.type === "city" &&
                              selected.id === city.id;

                            return (
                              <li key={city.id}>
                                <div
                                  className={cn(
                                    "group flex items-center gap-1 rounded-[10px] pr-1.5 text-sm",
                                    isCitySelected
                                      ? "bg-accent font-semibold"
                                      : "hover:bg-muted"
                                  )}
                                  style={{ paddingLeft: 44 }}
                                >
                                  <span className="w-7 shrink-0" />
                                  <button
                                    type="button"
                                    className="flex-1 cursor-pointer truncate py-2.5 text-left"
                                    onClick={() =>
                                      onSelectCity(
                                        country.id,
                                        province.id,
                                        city.id
                                      )
                                    }
                                  >
                                    {city.name}
                                    {!city.isActive && (
                                      <span className="font-normal text-muted-foreground">
                                        {" "}
                                        · inactive
                                      </span>
                                    )}
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}