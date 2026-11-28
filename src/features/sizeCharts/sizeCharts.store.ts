import { create } from "zustand";
import { CreateSizeChartDto, SizeChart } from "./sizeCharts.types";
import { SIZE_CHARTS_MOCK } from "./sizeCharts.mock";

type Result = { success: boolean; message: string };

type SizeChartsStore = {
  loading: boolean;
  saving: boolean;
  charts: SizeChart[];
  fetchCharts: () => Promise<void>;
  createChart: (dto: CreateSizeChartDto) => Promise<Result & { chart?: SizeChart }>;
};

/** Checks a chart before saving; returns an error message or null. */
export function validateSizeChart(dto: CreateSizeChartDto, existing: SizeChart[]): string | null {
  const name = dto.name.trim();
  if (!name) return "Give the chart a name";
  if (dto.columns.length < 2) return "Add at least 2 columns";
  if (dto.columns.some((c) => !c.trim())) return "Every column needs a name";
  if (new Set(dto.columns.map((c) => c.trim().toLowerCase())).size !== dto.columns.length)
    return "Column names must be different";
  if (dto.rows.length < 1) return "Add at least 1 row";
  if (dto.rows.some((r) => r.length !== dto.columns.length || r.some((v) => !v.trim())))
    return "Fill in every cell";
  if (existing.some((c) => c.brandId === dto.brandId && c.name.trim().toLowerCase() === name.toLowerCase()))
    return "This brand already has a chart with that name";
  return null;
}

export const useSizeChartsStore = create<SizeChartsStore>((set, get) => {
  const source = () => (get().charts.length ? get().charts : SIZE_CHARTS_MOCK);

  return {
    loading: false,
    saving: false,
    charts: [],

    fetchCharts: async () => {
      set({ loading: true });
      // TODO(api): const res = await sizeChartsApi.getSizeCharts({ brandId }); — GET /admin/size-charts?brandId=…
      set({ charts: source(), loading: false });
    },

    createChart: async (dto) => {
      const clean: CreateSizeChartDto = {
        ...dto,
        name: dto.name.trim(),
        columns: dto.columns.map((c) => c.trim()),
        rows: dto.rows.map((r) => r.map((v) => v.trim())),
      };
      const error = validateSizeChart(clean, source());
      if (error) return { success: false, message: error };
      set({ saving: true });
      // TODO(api): const res = await sizeChartsApi.create(clean); — POST /admin/size-charts, returns the chart id.
      const chart: SizeChart = { ...clean, id: `sc-${Date.now()}` };
      set({ charts: [...source(), chart], saving: false });
      return { success: true, message: "Size chart saved", chart };
    },
  };
});
