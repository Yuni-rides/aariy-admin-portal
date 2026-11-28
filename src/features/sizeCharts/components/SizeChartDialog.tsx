"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ds, selectClass } from "@/features/products/components/ProductFormParts";
import { CreateSizeChartDto, SizeChart, SizeChartUnit } from "../sizeCharts.types";

type SizeChartDialogProps = {
  open: boolean;
  brandId: string;
  brandName: string;
  saving: boolean;
  onClose: () => void;
  /** Return the saved chart to close the dialog, or an error message to show. */
  onSave: (dto: CreateSizeChartDto) => Promise<SizeChart | string>;
};

const START_COLUMNS = ["Size", "Chest", "Waist", "Length"];
const START_ROWS = [
  ["S", "", "", ""],
  ["M", "", "", ""],
  ["L", "", "", ""],
];

/** "New size chart" popup from the Add product page. The chart is saved for the brand. */
export function SizeChartDialog({ open, brandId, brandName, saving, onClose, onSave }: SizeChartDialogProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<SizeChartUnit>("CM");
  const [columns, setColumns] = useState<string[]>(START_COLUMNS);
  const [rows, setRows] = useState<string[][]>(START_ROWS);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setUnit("CM");
    setColumns(START_COLUMNS);
    setRows(START_ROWS.map((r) => [...r]));
    setError("");
  }, [open]);

  const setCell = (r: number, c: number, value: string) => {
    setRows((rs) => rs.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row)));
    setError("");
  };

  const removeColumn = (c: number) => {
    setColumns((cs) => cs.filter((_, i) => i !== c));
    setRows((rs) => rs.map((row) => row.filter((_, i) => i !== c)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await onSave({ brandId, name, unit, columns, rows });
    if (typeof res === "string") setError(res);
    else onClose();
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-[632px]">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sc-dialog-title"
        className="flex max-h-[90vh] flex-col gap-[18px] overflow-y-auto rounded-[14px] bg-white p-6 text-[#1F1A17]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="sc-dialog-title" className="m-0 text-lg font-bold">
              New size chart
            </h2>
            <p className={cn(ds.hint, "text-[13px]")}>
              For brand {brandName}. It can be reused on the brand&apos;s other products.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="grid h-11 w-11 flex-none cursor-pointer place-items-center border-0 bg-transparent text-[#6B5E57]"
            onClick={onClose}
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sc-name" className={ds.label}>
              Chart name
            </label>
            <input
              id="sc-name"
              className={ds.input}
              placeholder="e.g. Lehenga regular"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sc-unit" className={ds.label}>
              Unit
            </label>
            <Select value={unit} onValueChange={(v) => setUnit(v as SizeChartUnit)}>
              <SelectTrigger id="sc-unit" className={selectClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CM">CM</SelectItem>
                <SelectItem value="INCH">INCH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={ds.label}>Table</span>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {columns.map((col, c) => (
                    <th key={c} scope="col" className="pb-1.5 pr-1.5 font-normal">
                      <div className="relative">
                        <input
                          aria-label={`Column ${c + 1} name`}
                          className={cn(ds.input, "min-w-[90px] bg-[#FBF8F6] pr-7 font-semibold")}
                          value={col}
                          onChange={(e) => {
                            setColumns((cs) => cs.map((v, i) => (i === c ? e.target.value : v)));
                            setError("");
                          }}
                        />
                        {columns.length > 2 && (
                          <button
                            type="button"
                            aria-label={`Remove column ${col || c + 1}`}
                            className="absolute right-1.5 top-1/2 grid h-6 w-6 -translate-y-1/2 cursor-pointer place-items-center rounded border-0 bg-transparent text-[#8A7B73] hover:text-[#B3261E]"
                            onClick={() => removeColumn(c)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {rows.length > 1 && <th className="w-8" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((value, c) => (
                      <td key={c} className="pb-1.5 pr-1.5">
                        <input
                          aria-label={`Row ${r + 1} ${columns[c] || `column ${c + 1}`}`}
                          className={cn(ds.input, "min-w-[90px]")}
                          value={value}
                          onChange={(e) => setCell(r, c, e.target.value)}
                        />
                      </td>
                    ))}
                    {rows.length > 1 && (
                      <td className="pb-1.5">
                        <button
                          type="button"
                          aria-label={`Remove row ${r + 1}`}
                          className="grid h-8 w-8 cursor-pointer place-items-center border-0 bg-transparent text-[#8A7B73] hover:text-[#B3261E]"
                          onClick={() => setRows((rs) => rs.filter((_, i) => i !== r))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button type="button" className={cn(ds.btn, ds.soft)} onClick={() => setRows((rs) => [...rs, columns.map(() => "")])}>
              + Add row
            </button>
            <button
              type="button"
              className={cn(ds.btn, ds.ghost, "h-10")}
              onClick={() => {
                setColumns((cs) => [...cs, ""]);
                setRows((rs) => rs.map((row) => [...row, ""]));
              }}
            >
              + Add column
            </button>
          </div>
          <p className={ds.hint}>At least 2 columns and 1 row. Every row needs one value per column.</p>
        </div>

        {error && <p className={cn(ds.error, "text-sm")}>{error}</p>}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#EADFD8] pt-4">
          <button type="button" className={cn(ds.btn, ds.ghost)} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={cn(ds.btn, ds.primary)}>
            {saving ? "Saving..." : "Save chart"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
