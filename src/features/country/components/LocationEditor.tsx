"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  CountryNode,
  CreateCountryDto,
  CreateProvinceDto,
  EditorMode,
} from "../country.types";

const REGION_TYPES = ["PROVINCE", "STATE", "EMIRATE", "TERRITORY"] as const;

type LocationEditorProps = {
  countries: CountryNode[];
  mode: NonNullable<EditorMode>;
  saving: boolean;
  onCreateCountry: (dto: CreateCountryDto) => void;
  onCreateProvince: (dto: CreateProvinceDto) => void;
  onCreateCity: (countryId: string, provinceId: string, name: string) => void;
  onUpdateCountry: (id: string, data: { name?: string }) => void;
  onUpdateProvince: (
    countryId: string,
    provinceId: string,
    data: { name?: string }
  ) => void;
  onUpdateCity: (
    countryId: string,
    provinceId: string,
    cityId: string,
    data: { name?: string; isActive?: boolean }
  ) => void;
  onDeleteCountry: (id: string) => void;
  onDeleteProvince: (countryId: string, provinceId: string) => void;
  onDeleteCity: (countryId: string, provinceId: string, cityId: string) => void;
  onStartAddProvince: (countryId: string) => void;
  onStartAddCity: (countryId: string, provinceId: string) => void;
  onCancel: () => void;
};

export function LocationEditor({
  countries,
  mode,
  saving,
  onCreateCountry,
  onCreateProvince,
  onCreateCity,
  onUpdateCountry,
  onUpdateProvince,
  onUpdateCity,
  onDeleteCountry,
  onDeleteProvince,
  onDeleteCity,
  onStartAddProvince,
  onStartAddCity,
  onCancel,
}: LocationEditorProps) {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currency, setCurrency] = useState("");
  const [timezone, setTimezone] = useState("");
  const [regionCode, setRegionCode] = useState("");
  const [regionType, setRegionType] = useState("PROVINCE");

  const [errors, setErrors] = useState<{
    name?: string;
    countryCode?: string;
    currency?: string;
    timezone?: string;
    regionCode?: string;
    regionType?: string;
  }>({});

  const selectedCountry =
    mode.type === "edit-country"
      ? countries.find((c) => c.id === mode.id)
      : mode.type === "create-province" ||
          mode.type === "edit-province" ||
          mode.type === "create-city" ||
          mode.type === "edit-city"
        ? countries.find((c) => c.id === mode.countryId)
        : undefined;

  const selectedProvince =
    mode.type === "edit-province"
      ? selectedCountry?.provinces.find((p) => p.id === mode.id)
      : mode.type === "create-city" || mode.type === "edit-city"
        ? selectedCountry?.provinces.find((p) => p.id === mode.provinceId)
        : undefined;

  const selectedCity =
    mode.type === "edit-city"
      ? selectedProvince?.cities.find((city) => city.id === mode.id)
      : undefined;

  useEffect(() => {
    setErrors({});
    if (mode.type === "edit-country" && selectedCountry) {
      setName(selectedCountry.name);
    } else if (mode.type === "edit-province" && selectedProvince) {
      setName(selectedProvince.name);
    } else if (mode.type === "edit-city" && selectedCity) {
      setName(selectedCity.name);
    } else {
      setName("");
      setCountryCode("");
      setCurrency("");
      setTimezone("");
      setRegionCode("");
      setRegionType("PROVINCE");
    }
  }, [mode, selectedCountry, selectedProvince, selectedCity]);

  const isEdit =
    mode.type === "edit-country" ||
    mode.type === "edit-province" ||
    mode.type === "edit-city";

  const canDeleteCountry =
    mode.type === "edit-country" &&
    (selectedCountry?.provinces.length ?? 0) === 0;

  const canDeleteProvince =
    mode.type === "edit-province" &&
    (selectedProvince?.cities.length ?? 0) === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};

    if (!name.trim()) next.name = "Name is required";

    // if (mode.type === "create-country") {
    //   if (!countryCode.trim()) next.countryCode = "Country code is required";
    //   if (!currency.trim()) next.currency = "Currency is required";
    //   if (!timezone.trim()) next.timezone = "Timezone is required";
    // }

    // if (mode.type === "create-province") {
    //   if (!regionCode.trim()) next.regionCode = "Code is required";
    //   if (!regionType.trim()) next.regionType = "Type is required";
    // }

    setErrors(next);
    if (Object.keys(next).length) return;

    if (mode.type === "create-country") {
      onCreateCountry({
        name: name.trim(),
        countryCode: countryCode.trim().toUpperCase(),
        currency: currency.trim().toUpperCase(),
        timezone: timezone.trim(),
      });
    } else if (mode.type === "create-province") {
      onCreateProvince({
        countryId: mode.countryId,
        name: name.trim(),
        // code: regionCode.trim().toUpperCase(),
        // type: regionType,
      });
    } else if (mode.type === "create-city") {
      onCreateCity(mode.countryId, mode.provinceId, name.trim());
    } else if (mode.type === "edit-country") {
      onUpdateCountry(mode.id, { name: name.trim() });
    } else if (mode.type === "edit-province") {
      onUpdateProvince(mode.countryId, mode.id, { name: name.trim() });
    } else if (mode.type === "edit-city") {
      onUpdateCity(mode.countryId, mode.provinceId, mode.id, {
        name: name.trim(),
        

      });
    }
  };

  const title =
    mode.type === "create-country"
      ? "New country"
      : mode.type === "create-province"
        ? `New province in ${selectedCountry?.name ?? ""}`
        : mode.type === "create-city"
          ? `New city in ${selectedProvince?.name ?? ""}`
          : mode.type === "edit-country"
            ? selectedCountry?.name ?? "Edit country"
            : mode.type === "edit-province"
              ? selectedProvince?.name ?? "Edit province"
              : selectedCity?.name ?? "Edit city";

  const fieldLabel = mode.type.includes("country")
    ? "Country name"
    : mode.type.includes("province")
      ? "Province name"
      : "City name";

  const fieldPlaceholder = mode.type.includes("country")
    ? "e.g. United Arab Emirates"
    : mode.type.includes("province")
      ? "e.g. Sharjah"
      : "e.g. Lahore";

  return (
    <Card className="rounded-2xl p-[18px] shadow-none">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          {mode.type === "edit-city" && selectedCity && (
            <StatusBadge tone={selectedCity.isActive ? "success" : "neutral"}>
              {selectedCity.isActive ? "Active" : "Inactive"}
            </StatusBadge>
          )}

          
        </div>

        {/* <p className="text-[13px] text-muted-foreground">
          {mode.type === "create-country" && "Top-level country"}
          {mode.type === "create-province" &&
            `Country: ${selectedCountry?.name ?? ""}`}
          {mode.type === "create-city" &&
            `Path: ${selectedCountry?.name ?? ""} / ${selectedProvince?.name ?? ""}`}
          {mode.type === "edit-country" &&
            `Country · ${selectedCountry?.provinces.length ?? 0} provinces`}
          {mode.type === "edit-province" &&
            `Path: ${selectedCountry?.name ?? ""} / ${selectedProvince?.name ?? ""} · ${selectedProvince?.cities.length ?? 0} cities`}
          {mode.type === "edit-city" &&
            `Path: ${selectedCountry?.name ?? ""} / ${selectedProvince?.name ?? ""} / ${selectedCity?.name ?? ""}`}
        </p> */}

        <div>
          <Label
            htmlFor="loc-name"
            className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
          >
            {fieldLabel}
          </Label>
          <Input
            id="loc-name"
            className="h-11 rounded-[10px] bg-white"
            placeholder={fieldPlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Extra fields sirf Create Country ke liye */}
        {mode.type === "create-country" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {/* <div>
              <Label
                htmlFor="country-code"
                className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
              >
                Country code
              </Label>
              <Input
                id="country-code"
                className="h-11 rounded-[10px] bg-white uppercase"
                placeholder="e.g. AE"
                maxLength={3}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                aria-invalid={!!errors.countryCode}
              />
              {errors.countryCode && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.countryCode}
                </p>
              )}
            </div> */}

            {/* <div>
              <Label
                htmlFor="country-currency"
                className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
              >
                Currency
              </Label>
              <Input
                id="country-currency"
                className="h-11 rounded-[10px] bg-white uppercase"
                placeholder="e.g. AED"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                aria-invalid={!!errors.currency}
              />
              {errors.currency && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.currency}
                </p>
              )}
            </div> */}

            {/* <div>
              <Label
                htmlFor="country-timezone"
                className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
              >
                Timezone
              </Label>
              <Input
                id="country-timezone"
                className="h-11 rounded-[10px] bg-white"
                placeholder="e.g. Asia/Dubai"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                aria-invalid={!!errors.timezone}
              />
              {errors.timezone && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.timezone}
                </p>
              )}
            </div> */}
          </div>
        )}

        {/* Extra fields sirf Create Province ke liye */}
        {mode.type === "create-province" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label
                htmlFor="region-code"
                className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
              >
                Region / Province code
              </Label>
              <Input
                id="region-code"
                className="h-11 rounded-[10px] bg-white uppercase"
                placeholder="e.g. SH"
                maxLength={5}
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                aria-invalid={!!errors.regionCode}
              />
              {errors.regionCode && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.regionCode}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="region-type"
                className="mb-1.5 block text-[13px] font-normal text-muted-foreground"
              >
                Type
              </Label>
              <Select value={regionType} onValueChange={setRegionType}>
                <SelectTrigger
                  id="region-type"
                  className="h-11 cursor-pointer rounded-[10px] bg-white"
                  aria-invalid={!!errors.regionType}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.regionType && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.regionType}
                </p>
              )}
            </div>
          </div>
        )}

        {/* City Active/Inactive Toggle */}
        {mode.type === "edit-city" && selectedCity && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(selectedCity.isActive)}
              disabled={saving}
              onCheckedChange={(v) => {
                
                onUpdateCity(mode.countryId, mode.provinceId, mode.id, {
                  isActive: v === true,
                });
              }}
              className="h-5 w-5 rounded"
            />
            Active
          </label>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : mode.type === "create-country"
                  ? "Create country"
                  : mode.type === "create-province"
                    ? "Add province"
                    : "Add city"}
          </Button>

          {mode.type === "edit-country" && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => onStartAddProvince(mode.id)}
            >
              <Plus /> Add province
            </Button>
          )}

          {mode.type === "edit-province" && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => onStartAddCity(mode.countryId, mode.id)}
            >
              <Plus /> Add city
            </Button>
          )}

          {!isEdit && (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          {mode.type === "edit-country" && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
              disabled={!canDeleteCountry}
              title={
                canDeleteCountry
                  ? "Delete country"
                  : "Delete all provinces under this country first"
              }
              onClick={() => onDeleteCountry(mode.id)}
            >
              <Trash2 /> Delete
            </Button>
          )}

          {mode.type === "edit-province" && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
              disabled={!canDeleteProvince}
              title={
                canDeleteProvince
                  ? "Delete province"
                  : "Delete all cities under this province first"
              }
              onClick={() => onDeleteProvince(mode.countryId, mode.id)}
            >
              <Trash2 /> Delete
            </Button>
          )}

          {mode.type === "edit-city" && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto min-h-11 cursor-pointer rounded-[10px] text-destructive"
              onClick={() =>
                onDeleteCity(mode.countryId, mode.provinceId, mode.id)
              }
            >
              <Trash2 /> Delete
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}