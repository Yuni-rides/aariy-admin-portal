"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { toast } from "@/hooks/useToast";
import { useLocationsStore } from "../country.store";
import { EditorMode, SelectedLocation } from "../country.types";
import { LocationTree } from "./LocationTree";
import { LocationEditor } from "./LocationEditor";

export default function CountryPage() {
  const {
    tree,
    meta,
    loading,
    saving,
    fetchLocations,
    setPage,
    createCountry,
    updateCountry,
    deleteCountry,
    createProvince,
    updateProvince,
    deleteProvince,
    createCity,
    updateCity,
    deleteCity,
  } = useLocationsStore();

  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>({
    type: "create-country",

  });

  useEffect(() => {
    fetchLocations({ page: 1, limit: 10 });
  }, [fetchLocations]);

  const handleSelectCountry = (countryId: string) => {
    setSelected({ type: "country", id: countryId });
    setEditorMode({ type: "edit-country", id: countryId });
  };

  const handleSelectProvince = (countryId: string, provinceId: string) => {
    setSelected({ type: "province", id: provinceId, countryId });
    setEditorMode({ type: "edit-province", id: provinceId, countryId });
  };

  
  const handleSelectCity = (
    countryId: string,
    provinceId: string,
    cityId: string
  ) => {
    setSelected({ type: "city", id: cityId, provinceId, countryId });
    setEditorMode({ type: "edit-city", id: cityId, provinceId, countryId });
  };

  const handleStartAddProvince = (countryId: string) => {
    setSelected({ type: "country", id: countryId });
    setEditorMode({ type: "create-province", countryId });
  };

  const handleStartAddCity = (countryId: string, provinceId: string) => {
    setSelected({ type: "province", id: provinceId, countryId });
    setEditorMode({ type: "create-city", countryId, provinceId });
  };

  const notify = (res: { success: boolean; message: string }) => {
    toast({
      variant: res.success ? "default" : "destructive",
      title: res.success ? "Success" : "Error",
      description: res.message,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Countries, Provinces & Cities</h1>
        <Button
          className="min-h-11 cursor-pointer rounded-[10px]"
          onClick={() => {
            setSelected(null);
            setEditorMode({ type: "create-country" });
          }}
        >
          <Plus /> Add country
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* Left: Expandable Country -> Province -> City Tree + Pagination */}
        <Card className="flex flex-col justify-between rounded-2xl p-[18px] shadow-none">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <LocationTree
              countries={tree}
              selected={selected}
              onSelectCountry={handleSelectCountry}
              onSelectProvince={handleSelectProvince}
              onSelectCity={handleSelectCity}
              onAddProvince={handleStartAddProvince}
              onAddCity={handleStartAddCity}
            />
          )}



          <Pagination
            page={meta.page}
            total={meta.total}
            limit={meta.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </Card>

        {/* Right: Create / Edit Form */}
        <div>
          {editorMode ? (
            <LocationEditor
              countries={tree}
              mode={editorMode}
              saving={saving}
              onCreateCountry={async (dto) => {
                console.log(createCountry);
                const res = await createCountry( dto );
                notify(res);
                if (res.success) setEditorMode({ type: "create-country" });
              }}
              onCreateProvince={async (dto) => {
                const res = await createProvince(dto);
                notify(res);
                if (res.success) {
setEditorMode({ type: "create-province", countryId: dto.countryId });                }
              }}
              onCreateCity={async (countryId, provinceId, name) => {
                const res = await createCity({ countryId, provinceId, name });
                notify(res);
                if (res.success) {
                  setEditorMode({ type: "create-city", countryId, provinceId });
                }
              }}
              onUpdateCountry={async (id, data) => {
                const res = await updateCountry(id, data);
                notify(res);
              }}
              onUpdateProvince={async (countryId, provinceId, data) => {
                const res = await updateProvince(countryId, provinceId, data);
                notify(res);
              }}
              onUpdateCity={async (countryId, provinceId, cityId, data) => {
                const res = await updateCity(
                  countryId,
                  provinceId,
                  cityId,
                  data
                );
                notify(res);
              }}
              onDeleteCountry={async (id) => {
                const res = await deleteCountry(id);
                notify(res);
                if (res.success) {
                  setSelected(null);
                  setEditorMode({ type: "create-country" });
                }
              }}
              onDeleteProvince={async (countryId, provinceId) => {
                const res = await deleteProvince(countryId, provinceId);
                notify(res);
                if (res.success) {
                  setSelected({ type: "country", id: countryId });
                  setEditorMode({ type: "edit-country", id: countryId });
                }
              }}
              onDeleteCity={async (countryId, provinceId, cityId) => {
                const res = await deleteCity(countryId, provinceId, cityId);
                notify(res);
                if (res.success) {
                  setSelected({
                    type: "province",
                    id: provinceId,
                    countryId,
                  });
                  setEditorMode({
                    type: "edit-province",
                    id: provinceId,
                    countryId,
                  });
                }
              }}
              onStartAddProvince={handleStartAddProvince}
              onStartAddCity={handleStartAddCity}
              onCancel={() => {
                setSelected(null);
                setEditorMode(null);
              }}
            />
          ) : (
            <Card className="rounded-2xl p-[18px] text-sm text-muted-foreground shadow-none">
              Select a country, province, or city from the list, or click "Add
              country" to create one.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}