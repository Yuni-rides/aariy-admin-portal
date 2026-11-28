// TEMPORARY: mock data until the size charts API is ready.
// Delete this file once sizeCharts.api.ts is wired into the store.
import { SizeChart } from "./sizeCharts.types";

const kurta = (id: string, brandId: string): SizeChart => ({
  id,
  brandId,
  name: "Kurta regular",
  unit: "CM",
  columns: ["Size", "Chest", "Length"],
  rows: [
    ["S", "92", "112"],
    ["M", "97", "114"],
    ["L", "102", "116"],
  ],
});

const lehenga = (id: string, brandId: string): SizeChart => ({
  id,
  brandId,
  name: "Lehenga regular",
  unit: "CM",
  columns: ["Size", "Chest", "Waist", "Length"],
  rows: [
    ["S", "34", "28", "42"],
    ["M", "36", "30", "43"],
    ["L", "38", "32", "44"],
  ],
});

export const SIZE_CHARTS_MOCK: SizeChart[] = [
  kurta("sc-kurta-regular", "maria-b"),
  kurta("sc-brand-01-kurta", "brand-01"),
  lehenga("sc-brand-01-lehenga", "brand-01"),
  kurta("sc-brand-02-kurta", "brand-02"),
];
