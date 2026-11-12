"use client";

import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { toast } from "@/hooks/useToast";
import { isCurrentUser, useStaffStore } from "../staff.store";
import { useRolesStore } from "@/features/roles/roles.store";
import { SUPER_ADMIN_ROLE_ID, roleName, summarizePermissions } from "@/features/roles/roles.helpers";
import { InviteStaffDto, IssuedLink, StaffMember, StaffRole } from "../staff.types";
import {
  formatLastLogin,
  isLinkExpired,
  isValidEmail,
  staffStatusLabelMap,
  staffStatusToneMap,
} from "../staff.helpers";
import { IssuedLinkDialog } from "./IssuedLinkDialog";

type Result = { success: boolean; message: string };
type Confirm = { kind: "deactivate" | "revoke"; member: StaffMember } | null;

const labelClass = "mb-1.5 block text-[13px] font-normal text-muted-foreground";
const EMPTY_INVITE = { name: "", email: "", role: "" };

export default function StaffPage() {
  const {
    staff,
    loading,
    saving,
    fetchStaff,
    inviteStaff,
    issueLink,
    changeRole,
    deactivate,
    reactivate,
    revokeInvite,
  } = useStaffStore();

  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [issued, setIssued] = useState<IssuedLink | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const { roles, fetchRoles } = useRolesStore();
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const roleOptions = useMemo(() => roles.map((r) => ({ value: r.id, label: r.name })), [roles]);
  const permissionSummary = (roleId: string) =>
    summarizePermissions(roleId, roles.find((r) => r.id === roleId)?.permissions ?? {});

  const notify = <T extends Result>(res: T): T => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res;
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!invite.name.trim()) errors.name = "Name is required";
    if (!isValidEmail(invite.email)) errors.email = "Enter a valid email";
    else if (staff.some((m) => m.email.toLowerCase() === invite.email.trim().toLowerCase()))
      errors.email = "Already on the staff list";
    if (!invite.role) errors.role = "Choose a role";
    setInviteErrors(errors);
    if (Object.keys(errors).length) return;

    const res = notify(await inviteStaff(invite as InviteStaffDto));
    if (res.success && res.link) {
      setInvite(EMPTY_INVITE);
      setIssued(res.link);
    }
  };

  const handleLink = async (m: StaffMember) => {
    const res = notify(await issueLink(m.id));
    if (res.success && res.link) setIssued(res.link);
  };

  const sorted = useMemo(() => {
    // Super admin first, then roles in the order Roles & Permissions lists them.
    const rank = (id: StaffRole) => (id === SUPER_ADMIN_ROLE_ID ? -1 : roles.findIndex((r) => r.id === id));
    const statusRank = { ACTIVE: 0, PENDING: 1, DEACTIVATED: 2 };
    return [...staff].sort(
      (a, b) => statusRank[a.status] - statusRank[b.status] || rank(a.role) - rank(b.role) || a.name.localeCompare(b.name),
    );
  }, [staff, roles]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-[13px] text-muted-foreground">
          Super admin has full access. Staff only get the permissions of their role.
        </p>
      </div>

      {/* Invite */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <form onSubmit={submitInvite} noValidate className="flex flex-wrap items-start gap-3">
          <div className="min-w-[180px] flex-1">
            <Label htmlFor="invite-name" className={labelClass}>Name</Label>
            <Input
              id="invite-name"
              className="h-11 rounded-[10px] bg-white"
              value={invite.name}
              aria-invalid={!!inviteErrors.name}
              onChange={(e) => {
                setInvite((v) => ({ ...v, name: e.target.value }));
                setInviteErrors(({ name, ...rest }) => rest);
              }}
            />
            {inviteErrors.name && <p className="mt-1 text-xs text-destructive">{inviteErrors.name}</p>}
          </div>
          <div className="min-w-[200px] flex-1">
            <Label htmlFor="invite-email" className={labelClass}>Email</Label>
            <Input
              id="invite-email"
              type="email"
              className="h-11 rounded-[10px] bg-white"
              value={invite.email}
              aria-invalid={!!inviteErrors.email}
              onChange={(e) => {
                setInvite((v) => ({ ...v, email: e.target.value }));
                setInviteErrors(({ email, ...rest }) => rest);
              }}
            />
            {inviteErrors.email && <p className="mt-1 text-xs text-destructive">{inviteErrors.email}</p>}
          </div>
          <div className="min-w-[180px] flex-1">
            <FilterSelect
              label="Staff role"
              value={invite.role}
              options={roleOptions}
              placeholder="Choose role…"
              onChange={(v) => {
                setInvite((s) => ({ ...s, role: v }));
                setInviteErrors(({ role, ...rest }) => rest);
              }}
            />
            {inviteErrors.role ? (
              <p className="mt-1 text-xs text-destructive">{inviteErrors.role}</p>
            ) : (
              invite.role && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Can use: {permissionSummary(invite.role)}
                </p>
              )
            )}
          </div>
          <Button type="submit" disabled={saving} className="mt-[22px] min-h-11 cursor-pointer rounded-[10px]">
            Invite &amp; create setup link
          </Button>
        </form>
      </Card>

      {/* Staff list */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center">Loading...</TableCell>
              </TableRow>
            ) : (
              sorted.map((m) => {
                const me = isCurrentUser(m);
                const expired = m.status === "PENDING" && isLinkExpired(m);
                return (
                  <TableRow key={m.id} className={m.status === "DEACTIVATED" ? "text-muted-foreground" : undefined}>
                    <TableCell>
                      <p className="font-medium">
                        {m.name}
                        {me && <span className="font-normal text-muted-foreground"> (you)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{roleName(roles, m.role)}</TableCell>
                    <TableCell className="max-w-[240px] text-[13px]">{permissionSummary(m.role)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge tone={staffStatusToneMap[m.status]}>{staffStatusLabelMap[m.status]}</StatusBadge>
                        {expired && <span className="text-xs text-destructive">Setup link expired</span>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatLastLogin(m.lastLoginAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {m.status !== "DEACTIVATED" && (
                          <Button
                            size="sm"
                            variant={expired ? "default" : "secondary"}
                            disabled={saving}
                            className="cursor-pointer whitespace-nowrap rounded-[10px]"
                            onClick={() => handleLink(m)}
                          >
                            {m.status === "PENDING" ? "New setup link" : "Reset link"}
                          </Button>
                        )}
                        {!me && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`More actions for ${m.name}`} className="cursor-pointer">
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs text-muted-foreground">{m.name}</DropdownMenuLabel>
                              {m.status !== "DEACTIVATED" && m.role !== SUPER_ADMIN_ROLE_ID && (
                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger className="cursor-pointer">Change role</DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup
                                      value={m.role}
                                      onValueChange={async (v) => notify(await changeRole(m.id, v))}
                                    >
                                      {roles.map((r) => (
                                        <DropdownMenuRadioItem key={r.id} value={r.id} className="cursor-pointer">
                                          {r.name}
                                        </DropdownMenuRadioItem>
                                      ))}
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>
                              )}
                              <DropdownMenuSeparator />
                              {m.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onSelect={() => setConfirm({ kind: "deactivate", member: m })}
                                >
                                  Deactivate
                                </DropdownMenuItem>
                              )}
                              {m.status === "DEACTIVATED" && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onSelect={async () => notify(await reactivate(m.id))}
                                >
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              {m.status === "PENDING" && (
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onSelect={() => setConfirm({ kind: "revoke", member: m })}
                                >
                                  Revoke invite
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-[13px] text-muted-foreground">
        Role permissions are set in Roles &amp; Permissions. Invites, role changes and links are written to the audit log.
      </p>

      <IssuedLinkDialog link={issued} onClose={() => setIssued(null)} />

      <ConfirmDialog
        open={confirm !== null}
        loading={saving}
        destructive
        title={
          confirm?.kind === "deactivate"
            ? `Deactivate ${confirm.member.name}?`
            : `Revoke the invite for ${confirm?.member.email ?? ""}?`
        }
        description={
          confirm?.kind === "deactivate"
            ? "They are signed out and can't sign in until reactivated. Their past actions stay in the audit log."
            : "The setup link stops working. You can invite them again later."
        }
        confirmLabel={confirm?.kind === "deactivate" ? "Deactivate" : "Revoke invite"}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const res = notify(
            confirm.kind === "deactivate" ? await deactivate(confirm.member.id) : await revokeInvite(confirm.member.id),
          );
          if (res.success) setConfirm(null);
        }}
      />
    </div>
  );
}
