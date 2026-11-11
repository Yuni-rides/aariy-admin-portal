"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { CreateSellerDto, KybDocumentType } from "../sellers.types";
import {
  KYB_FILE_ACCEPT,
  KYB_MAX_FILE_MB,
  REQUIRED_KYB_DOCUMENTS,
  kybDocumentLabelMap,
  validateIdNumber,
  validateKybFile,
  validateNtn,
  validatePhone,
} from "../sellers.helpers";

type AddSellerModalProps = {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateSellerDto) => Promise<boolean>;
};

type RequiredDocType = (typeof REQUIRED_KYB_DOCUMENTS)[number];
type Fields = Omit<CreateSellerDto, "documents" | "tier">;
type OtherDoc = { key: number; title: string; file: File | null };

const EMPTY_FIELDS: Fields = {
  name: "",
  legalName: "",
  contactEmail: "",
  contactPhone: "",
  idNumber: "",
  ntnNumber: "",
};

const FIELD_CONFIG: {
  key: keyof Fields;
  label: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "email";
}[] = [
  { key: "name", label: "Brand name" },
  { key: "legalName", label: "Legal name" },
  { key: "contactEmail", label: "Email", type: "email", inputMode: "email" },
  { key: "contactPhone", label: "Phone number", placeholder: "+92 300 1234567", inputMode: "tel" },
  { key: "idNumber", label: "CNIC / SSN number", placeholder: "12345-1234567-1", inputMode: "numeric" },
  { key: "ntnNumber", label: "NTN number", placeholder: "1234567-8", inputMode: "numeric" },
];

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";
const inputClass = "h-11 rounded-[10px] bg-white";

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function validateFields(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (!f.name.trim()) e.name = "Brand name is required";
  if (!f.legalName.trim()) e.legalName = "Legal name is required";
  if (!/^\S+@\S+\.\S+$/.test(f.contactEmail.trim())) e.contactEmail = "Enter a valid email";
  const phone = validatePhone(f.contactPhone);
  if (phone) e.contactPhone = phone;
  const id = validateIdNumber(f.idNumber);
  if (id) e.idNumber = id;
  const ntn = validateNtn(f.ntnNumber);
  if (ntn) e.ntnNumber = ntn;
  return e;
}

/** One file slot: empty dashed button, or the picked file with replace / remove. */
function FilePicker({
  id,
  label,
  file,
  error,
  onPick,
  onRemove,
}: {
  id: string;
  label: string;
  file: File | null;
  error?: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <input
        ref={ref}
        id={id}
        type="file"
        accept={KYB_FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onPick(picked);
          e.target.value = "";
        }}
      />
      {file ? (
        <div
          className={cn(
            "flex min-h-11 items-center gap-2.5 rounded-[10px] border bg-white px-3 py-2",
            error ? "border-destructive" : "border-input",
          )}
        >
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md px-2 py-1 text-[13px] text-primary hover:bg-accent"
            onClick={() => ref.current?.click()}
          >
            Replace
          </button>
          <button
            type="button"
            aria-label={`Remove ${label}`}
            className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Upload ${label}`}
          className={cn(
            "flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-[10px] border border-dashed bg-accent/40 px-3 py-2 text-left text-sm text-muted-foreground hover:border-primary hover:text-primary",
            error ? "border-destructive" : "border-[#D9805B]",
          )}
          onClick={() => ref.current?.click()}
        >
          <Upload className="h-4 w-4 shrink-0" />
          Upload file
        </button>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function AddSellerModal({ open, saving, onClose, onSubmit }: AddSellerModalProps) {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [docs, setDocs] = useState<Partial<Record<RequiredDocType, File>>>({});
  const [docErrors, setDocErrors] = useState<Partial<Record<RequiredDocType, string>>>({});
  const [others, setOthers] = useState<OtherDoc[]>([]);
  const [otherErrors, setOtherErrors] = useState<Record<number, { title?: string; file?: string }>>({});
  const nextKey = useRef(0);

  useEffect(() => {
    if (open) {
      setFields(EMPTY_FIELDS);
      setFieldErrors({});
      setDocs({});
      setDocErrors({});
      setOthers([]);
      setOtherErrors({});
    }
  }, [open]);

  const pickRequired = (type: RequiredDocType, file: File) => {
    const error = validateKybFile(file);
    setDocErrors((e) => ({ ...e, [type]: error ?? undefined }));
    if (!error) setDocs((d) => ({ ...d, [type]: file }));
  };

  const removeRequired = (type: RequiredDocType) =>
    setDocs((d) => {
      const next = { ...d };
      delete next[type];
      return next;
    });

  const updateOther = (key: number, patch: Partial<OtherDoc>) =>
    setOthers((list) => list.map((o) => (o.key === key ? { ...o, ...patch } : o)));

  const pickOther = (key: number, file: File) => {
    const error = validateKybFile(file);
    setOtherErrors((e) => ({ ...e, [key]: { ...e[key], file: error ?? undefined } }));
    if (!error) updateOther(key, { file });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fErr = validateFields(fields);

    const dErr: typeof docErrors = {};
    for (const type of REQUIRED_KYB_DOCUMENTS) {
      if (!docs[type]) dErr[type] = `${kybDocumentLabelMap[type]} is required`;
    }

    // A started "other" row needs both a title and a file; fully empty rows are ignored.
    const oErr: typeof otherErrors = {};
    for (const o of others) {
      if (!o.title.trim() && !o.file) continue;
      if (!o.title.trim()) oErr[o.key] = { ...oErr[o.key], title: "Name this document" };
      if (!o.file) oErr[o.key] = { ...oErr[o.key], file: "Choose a file" };
    }

    setFieldErrors(fErr);
    setDocErrors(dErr);
    setOtherErrors(oErr);
    if (Object.keys(fErr).length || Object.keys(dErr).length || Object.keys(oErr).length) return;

    const documents: CreateSellerDto["documents"] = [
      ...REQUIRED_KYB_DOCUMENTS.map((type) => ({ type, file: docs[type]! })),
      ...others
        .filter((o) => o.file && o.title.trim())
        .map((o) => ({ type: "OTHER" as KybDocumentType, title: o.title.trim(), file: o.file! })),
    ];

    const ok = await onSubmit({
      name: fields.name.trim(),
      legalName: fields.legalName.trim(),
      contactEmail: fields.contactEmail.trim(),
      contactPhone: fields.contactPhone.trim(),
      idNumber: fields.idNumber.trim(),
      ntnNumber: fields.ntnNumber.trim(),
      documents,
    });
    if (ok) onClose();
  };

  const uploadedCount = REQUIRED_KYB_DOCUMENTS.filter((t) => docs[t]).length;

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-h-[90vh] max-w-3xl">
      <form
        onSubmit={submit}
        noValidate
        className="flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-lg"
      >
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold">Add seller</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The seller starts in KYB pending until its documents are reviewed.
          </p>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* Business details */}
          <section className="flex flex-col gap-3">
            <h3 className="text-[15px] font-semibold">Business details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELD_CONFIG.map(({ key, label, type, placeholder, inputMode }) => (
                <div key={key}>
                  <Label htmlFor={`s-${key}`} className={labelClass}>{label}</Label>
                  <Input
                    id={`s-${key}`}
                    type={type ?? "text"}
                    inputMode={inputMode}
                    placeholder={placeholder}
                    className={inputClass}
                    value={fields[key]}
                    aria-invalid={!!fieldErrors[key]}
                    onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
                  />
                  {fieldErrors[key] && (
                    <p className="mt-1 text-xs text-destructive">{fieldErrors[key]}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Required KYB documents */}
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold">KYB documents</h3>
              <span className="text-[13px] text-muted-foreground">
                {uploadedCount} of {REQUIRED_KYB_DOCUMENTS.length} added · JPG, PNG, WEBP or PDF, up to {KYB_MAX_FILE_MB} MB
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {REQUIRED_KYB_DOCUMENTS.map((type) => (
                <div key={type}>
                  <Label htmlFor={`doc-${type}`} className={labelClass}>
                    {kybDocumentLabelMap[type]}
                  </Label>
                  <FilePicker
                    id={`doc-${type}`}
                    label={kybDocumentLabelMap[type]}
                    file={docs[type] ?? null}
                    error={docErrors[type]}
                    onPick={(file) => pickRequired(type, file)}
                    onRemove={() => removeRequired(type)}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Other documents */}
          <section className="flex flex-col gap-3">
            <div>
              <h3 className="text-[15px] font-semibold">Other documents (optional)</h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Anything else that supports the application, e.g. a trademark certificate.
              </p>
            </div>
            {others.map((o) => (
              <div key={o.key} className="grid items-start gap-3 rounded-[12px] border p-3 sm:grid-cols-[1fr_1fr_auto]">
                <div>
                  <Label htmlFor={`other-title-${o.key}`} className={labelClass}>Document name</Label>
                  <Input
                    id={`other-title-${o.key}`}
                    className={inputClass}
                    placeholder="Trademark certificate"
                    value={o.title}
                    onChange={(e) => updateOther(o.key, { title: e.target.value })}
                  />
                  {otherErrors[o.key]?.title && (
                    <p className="mt-1 text-xs text-destructive">{otherErrors[o.key]?.title}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor={`other-file-${o.key}`} className={labelClass}>File</Label>
                  <FilePicker
                    id={`other-file-${o.key}`}
                    label={o.title || "other document"}
                    file={o.file}
                    error={otherErrors[o.key]?.file}
                    onPick={(file) => pickOther(o.key, file)}
                    onRemove={() => updateOther(o.key, { file: null })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11 cursor-pointer self-end rounded-[10px] text-destructive"
                  aria-label="Remove this document"
                  onClick={() => setOthers((list) => list.filter((x) => x.key !== o.key))}
                >
                  <X /> Remove
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() =>
                  setOthers((list) => [...list, { key: nextKey.current++, title: "", file: null }])
                }
              >
                <Plus /> Add other document
              </Button>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
            {saving ? "Adding..." : "Add seller"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
