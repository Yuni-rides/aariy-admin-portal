"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { useStaffStore } from "@/features/staff/staff.store";
import { useRolesStore } from "../roles.store";
import { PermissionMatrix } from "../roles.types";
import {
  ACTIONS,
  MODULES,
  countPermissions,
  hasPermission,
  moduleState,
  samePermissions,
  setModuleAll,
  summarizePermissions,
  togglePermission,
} from "../roles.helpers";
import { RoleFormDialog } from "./RoleFormDialog";

type Result = { success: boolean; message: string };

export default function RolesPage() {
  const {
    roles,
    loading,
    saving,
    fetchRoles,
    savePermissions,
    createRole,
    updateRoleDetails,
    deleteRole,
  } = useRolesStore();
  const { staff, fetchStaff } = useStaffStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Unsaved edits, per role id. */
  const [drafts, setDrafts] = useState<Record<string, PermissionMatrix>>({});
  const [roleDialog, setRoleDialog] = useState<"new" | "edit" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchStaff();
  }, [fetchRoles, fetchStaff]);

  useEffect(() => {
    if (!selectedId && roles.length) setSelectedId(roles[0].id);
  }, [roles, selectedId]);

  const role = roles.find((r) => r.id === selectedId);
  const matrix = role ? drafts[role.id] ?? role.permissions : {};

  const changed = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(drafts).filter(([id, m]) => {
          const r = roles.find((x) => x.id === id);
          return r && !samePermissions(r.permissions, m);
        }),
      ),
    [drafts, roles],
  );
  const changedCount = Object.keys(changed).length;

  // Warn before leaving the page with unsaved permission changes.
  useEffect(() => {
    if (!changedCount) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changedCount]);

  const staffWithRole = (id: string) => staff.filter((m) => m.role === id && m.status !== "DEACTIVATED");

  const notify = <T extends Result>(res: T): T => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res;
  };

  const edit = (next: PermissionMatrix) => {
    if (!role) return;
    setDrafts((d) => ({ ...d, [role.id]: next }));
  };

  const save = async () => {
    const res = notify(await savePermissions(changed));
    if (res.success) setDrafts({});
  };

  const holders = role ? staffWithRole(role.id) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Roles &amp; Permissions</h1>
          <p className="text-[13px] text-muted-foreground">
            Super admin always has full access. Sidebar items and every API call follow these permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {changedCount > 0 && (
            <>
              <StatusBadge tone="warning">
                {changedCount} {changedCount === 1 ? "role" : "roles"} not saved
              </StatusBadge>
              <Button variant="ghost" className="min-h-11 cursor-pointer rounded-[10px]" onClick={() => setDrafts({})}>
                Discard
              </Button>
            </>
          )}
          <Button
            disabled={!changedCount || saving}
            className="min-h-11 cursor-pointer rounded-[10px]"
            onClick={save}
          >
            {saving ? "Saving..." : "Save permissions"}
          </Button>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Roles">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            aria-selected={r.id === selectedId}
            onClick={() => setSelectedId(r.id)}
            className={cn(
              "relative min-h-11 cursor-pointer rounded-[10px] border px-3.5 text-sm font-medium",
              r.id === selectedId
                ? "border-foreground bg-foreground text-white"
                : "border-input bg-white hover:bg-muted",
            )}
          >
            {r.name}
            {changed[r.id] && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#E0A11B]" aria-label="Unsaved changes" />
            )}
          </button>
        ))}
        <button
          type="button"
          aria-label="New role"
          title="New role"
          onClick={() => setRoleDialog("new")}
          className="grid min-h-11 w-11 cursor-pointer place-items-center rounded-[10px] border border-dashed border-input bg-white hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {loading || !role ? (
        <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">Loading...</Card>
      ) : (
        <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
          {/* Role details */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-semibold">{role.name}</h2>
                {role.isSystem ? (
                  <StatusBadge tone="neutral">Built-in</StatusBadge>
                ) : (
                  <StatusBadge tone="info">Custom</StatusBadge>
                )}
              </div>
              {role.description && <p className="text-[13px] text-muted-foreground">{role.description}</p>}
              <p className="mt-1 text-[13px] text-muted-foreground">
                {countPermissions(matrix)} permissions · {summarizePermissions(role.id, matrix)} ·{" "}
                <Link href="/staff" className="text-primary hover:underline">
                  {holders.length} {holders.length === 1 ? "staff member" : "staff"}
                </Link>
              </p>
            </div>
            {!role.isSystem && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="cursor-pointer rounded-[10px]" onClick={() => setRoleDialog("edit")}>
                  <Pencil /> Rename
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer rounded-[10px] text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 /> Delete
                </Button>
              </div>
            )}
          </div>

          {/* Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <colgroup>
                <col className="w-[220px]" />
                {ACTIONS.map((a) => (
                  <col key={a.key} />
                ))}
              </colgroup>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-2 py-2 font-medium">Module</th>
                  {ACTIONS.map((a) => (
                    <th key={a.key} className="px-2 py-2 text-center font-medium">{a.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((mod) => {
                  const state = moduleState(matrix, mod.key);
                  return (
                    <tr key={mod.key} className="border-t">
                      <td className="px-2 py-2.5">
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <Checkbox
                            checked={state === "all" ? true : state === "some" ? "indeterminate" : false}
                            onCheckedChange={() => edit(setModuleAll(matrix, mod.key, state !== "all"))}
                            aria-label={`All ${mod.label} permissions`}
                            className="h-4 w-4 rounded"
                          />
                          <span className="font-medium">{mod.label}</span>
                          {mod.sensitive && (
                            <span title="Gives control over who can do what">
                              <ShieldAlert className="h-3.5 w-3.5 text-[#8A5A00]" />
                            </span>
                          )}
                        </label>
                      </td>
                      {ACTIONS.map((a) => {
                        const applies = mod.actions.includes(a.key);
                        return (
                          <td key={a.key} className="px-2 py-2.5">
                            <div className="flex items-center justify-center">
                              {applies ? (
                                <Checkbox
                                  checked={hasPermission(matrix, mod.key, a.key)}
                                  onCheckedChange={() => edit(togglePermission(matrix, mod.key, a.key))}
                                  aria-label={`${mod.label}: ${a.label}`}
                                  title={mod.hints?.[a.key]}
                                  className="h-5 w-5 rounded"
                                />
                              ) : (
                                <span className="text-muted-foreground/50" aria-label="Not applicable">—</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[13px] text-muted-foreground">
            Ticking any action also gives View. Hover a box to see what it allows. Changes apply to staff on their next
            request and are written to the audit log.
          </p>
        </Card>
      )}

      <RoleFormDialog
        open={roleDialog !== null}
        role={roleDialog === "edit" ? role : undefined}
        roles={roles}
        saving={saving}
        onClose={() => setRoleDialog(null)}
        onSubmit={async (dto) => {
          if (roleDialog === "edit" && role) return notify(await updateRoleDetails(role.id, dto));
          const res = notify(await createRole(dto));
          if (res.success && res.id) setSelectedId(res.id);
          return res;
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        destructive
        loading={saving}
        title={`Delete the ${role?.name ?? ""} role?`}
        description={
          holders.length
            ? `${holders.length} staff still have this role. Move them to another role on the Staff page first.`
            : "This can't be undone."
        }
        confirmLabel="Delete role"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (!role) return;
          const res = notify(await deleteRole(role.id, holders.length));
          if (res.success) {
            setConfirmDelete(false);
            setDrafts(({ [role.id]: _, ...rest }) => rest);
            setSelectedId(roles.find((r) => r.id !== role.id)?.id ?? null);
          }
        }}
      />
    </div>
  );
}
