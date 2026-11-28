export type SizeChartUnit = "CM" | "INCH";

/** A size chart belongs to a brand and is shared by that brand's products. */
export type SizeChart = {
  id: string;
  brandId: string;
  name: string;
  unit: SizeChartUnit;
  /** Header row, e.g. ["Size", "Chest", "Waist", "Length"]. */
  columns: string[];
  /** One value per column in every row. */
  rows: string[][];
};

export type CreateSizeChartDto = Omit<SizeChart, "id">;
