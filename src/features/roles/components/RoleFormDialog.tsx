"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { Role } from "../roles.types";

type Result = { success: boolean; message: string };

type RoleFormDialogProps = {
  open: boolean;
  /** Set when renaming a custom role; otherwise creates a new one. */
  role?: Role;
  roles: Role[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (dto: { name: string; description: string; copyFromId: string | null }) => Promise<Result>;
};

const NONE = "__none__";
const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";

export function RoleFormDialog({ open, role, roles, saving, onClose, onSubmit }: RoleFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copyFrom, setCopyFrom] = useState(NONE);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setDescription(role?.description ?? "");
    setCopyFrom(NONE);
    setError("");
  }, [open, role]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    const res = await onSubmit({ name, description, copyFromId: copyFrom === NONE ? null : copyFrom });
    if (res.success) onClose();
    else setError(res.message);
  };

  return (
    <Modal open={open} onClose={onClose} className="h-auto max-w-md">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
        <div>
          <h2 className="text-lg font-semibold">{role ? "Edit role" : "New role"}</h2>
          {!role && (
            <p className="mt-1 text-sm text-muted-foreground">
              Start empty or copy another role, then tick its permissions.
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="role-name" className={labelClass}>Role name</Label>
          <Input
            id="role-name"
            className="h-11 rounded-[10px] bg-white"
            placeholder="e.g. Catalogue editor"
            value={name}
            aria-invalid={!!error}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <div>
          <Label htmlFor="role-desc" className={labelClass}>What is it for? (optional)</Label>
          <Input
            id="role-desc"
            className="h-11 rounded-[10px] bg-white"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {!role && (
          <FilterSelect
            label="Copy permissions from"
            value={copyFrom}
            options={[{ value: NONE, label: "Nothing (dashboard only)" }, ...roles.map((r) => ({ value: r.id, label: r.name }))]}
            onChange={setCopyFrom}
          />
        )}
        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button type="button" variant="secondary" className="min-h-11 cursor-pointer rounded-[10px]" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-h-11 cursor-pointer rounded-[10px]">
            {role ? "Save" : "Create role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
