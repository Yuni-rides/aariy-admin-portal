"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Label } from "@/components/ui/Label";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/TextArea";
import { formatPKR } from "@/lib/format";
import { getInitials } from "@/features/user/user.helpers";
import { PlatformUser } from "../users.types";
import {
  formatAddress,
  formatDate,
  formatDateTime,
  getUserBadge,
  hasDeletionRequest,
  userTypeLabelMap,
} from "../users.helpers";

type Result = { success: boolean; message: string };

type UserDetailPanelProps = {
  user: PlatformUser;
  saving: boolean;
  onSuspend: (reason: string) => Promise<Result>;
  onReactivate: () => Promise<Result>;
  onSignOutEverywhere: () => Promise<Result>;
  onApproveDeletion: () => Promise<Result>;
  onDeclineDeletion: () => Promise<Result>;
};

type Confirm = "signOut" | "approveDeletion" | "declineDeletion" | null;

export function UserDetailPanel({
  user,
  saving,
  onSuspend,
  onReactivate,
  onSignOutEverywhere,
  onApproveDeletion,
  onDeclineDeletion,
}: UserDetailPanelProps) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  useEffect(() => {
    setReason("");
    setReasonError("");
    setSuspending(false);
    setConfirm(null);
  }, [user.id]);

  const badge = getUserBadge(user);
  const deleted = user.status === "DELETED";
  const [first, ...rest] = user.name.split(" ");

  const submitSuspend = async () => {
    if (!reason.trim()) {
      setReasonError("Add a reason. It is kept in the audit log.");
      return;
    }
    const res = await onSuspend(reason);
    if (res.success) setSuspending(false);
  };

  const runConfirm = async () => {
    const action =
      confirm === "signOut"
        ? onSignOutEverywhere
        : confirm === "approveDeletion"
          ? onApproveDeletion
          : onDeclineDeletion;
    const res = await action();
    if (res.success) setConfirm(null);
  };

  return (
    <Card className="flex flex-col gap-4 rounded-2xl p-[18px] shadow-none">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent font-semibold">
          {getInitials(first, rest.join(" "))}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold">{user.name}</h2>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
            <StatusBadge tone="neutral">{userTypeLabelMap[user.type]}</StatusBadge>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2.5">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{user.mobile}</span>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t pt-3 text-[13px]">
        {user.type === "SELLER" && user.sellerId && (
          <>
            <dt className="text-muted-foreground">Seller</dt>
            <dd>
              <Link href="/sellers" className="text-primary hover:underline">
                {user.sellerName}
              </Link>
            </dd>
          </>
        )}
        <dt className="text-muted-foreground">Joined</dt>
        <dd>{formatDate(user.createdAt)}</dd>
        <dt className="text-muted-foreground">Last active</dt>
        <dd>{formatDateTime(user.lastActiveAt)}</dd>
        <dt className="text-muted-foreground">Market</dt>
        <dd>
          {user.market} · {user.locale === "ur-PK" ? "Urdu" : "English"}
        </dd>
        <dt className="text-muted-foreground">Signed in on</dt>
        <dd>
          {user.activeSessions} {user.activeSessions === 1 ? "device" : "devices"}
        </dd>
        {user.type === "BUYER" && (
          <>
            <dt className="text-muted-foreground">Orders</dt>
            <dd>
              {user.ordersCount}
              {user.ordersCount > 0 && ` · ${formatPKR(user.totalSpent)}`}
            </dd>
            <dt className="text-muted-foreground">Last order</dt>
            <dd>{formatDate(user.lastOrderAt)}</dd>
          </>
        )}
      </dl>

      {user.type === "BUYER" && !deleted && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-[13px] font-semibold">Addresses</h3>
          {user.addresses.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No saved addresses</p>
          ) : (
            user.addresses.map((a) => (
              <div key={a.id} className="flex gap-2.5 text-[13px]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p>
                    {formatAddress(a)}
                    {a.isDefault && <span className="text-muted-foreground"> · default</span>}
                  </p>
                  <p className="text-muted-foreground">{a.phone}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {user.status === "SUSPENDED" && user.suspendReason && (
        <p className="rounded-[10px] bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          Suspended {formatDate(user.suspendedAt)}: {user.suspendReason}
        </p>
      )}

      {deleted && (
        <p className="rounded-[10px] bg-muted px-3 py-2 text-[13px] text-muted-foreground">
          This account is deleted. Personal data has been removed; order history is
          kept for finance records.
        </p>
      )}

      {/* Pending deletion request */}
      {hasDeletionRequest(user) && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-[#F0D9A8] bg-[#FDF6E7] p-3">
          <p className="text-[13px]">
            <span className="font-semibold">Deletion requested</span> on{" "}
            {formatDate(user.deletionRequestedAt)}. Check there are no open orders,
            returns or refunds before approving.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={saving}
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => setConfirm("approveDeletion")}
            >
              Approve deletion
            </Button>
            <Button
              variant="secondary"
              disabled={saving}
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => setConfirm("declineDeletion")}
            >
              Decline
            </Button>
          </div>
        </div>
      )}

      {/* Account actions */}
      {!deleted && (
        <div className="flex flex-col gap-3 border-t pt-3">
          {user.status === "ACTIVE" && suspending && (
            <div>
              <Label htmlFor="suspend-reason" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
                Reason for suspension
              </Label>
              <Textarea
                id="suspend-reason"
                rows={2}
                className="rounded-[10px] bg-white"
                placeholder="e.g. Repeated cash-on-delivery refusals"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setReasonError("");
                }}
              />
              {reasonError && <p className="mt-1 text-xs text-destructive">{reasonError}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                The user is signed out and can&apos;t sign in until reactivated.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {user.status === "ACTIVE" &&
              (suspending ? (
                <>
                  <Button
                    variant="destructive"
                    disabled={saving}
                    className="min-h-11 cursor-pointer rounded-[10px]"
                    onClick={submitSuspend}
                  >
                    Confirm suspension
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-11 cursor-pointer rounded-[10px]"
                    onClick={() => setSuspending(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="min-h-11 cursor-pointer rounded-[10px] text-destructive"
                  onClick={() => setSuspending(true)}
                >
                  Suspend
                </Button>
              ))}
            {user.status === "SUSPENDED" && (
              <Button
                disabled={saving}
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={onReactivate}
              >
                Reactivate
              </Button>
            )}
            {!suspending && (
              <Button
                variant="secondary"
                disabled={saving || user.activeSessions === 0}
                title={user.activeSessions === 0 ? "Not signed in anywhere" : undefined}
                className="min-h-11 cursor-pointer rounded-[10px]"
                onClick={() => setConfirm("signOut")}
              >
                <LogOut /> Sign out everywhere
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        loading={saving}
        destructive={confirm === "approveDeletion"}
        title={
          confirm === "signOut"
            ? `Sign ${user.name} out of all devices?`
            : confirm === "approveDeletion"
              ? `Delete ${user.name}'s account?`
              : "Decline this deletion request?"
        }
        description={
          confirm === "signOut"
            ? "They will need to sign in again with an email code."
            : confirm === "approveDeletion"
              ? "Personal data and saved addresses are removed. This can't be undone."
              : "The account stays active. Let the user know why, e.g. an open order or refund."
        }
        confirmLabel={
          confirm === "signOut"
            ? "Sign out"
            : confirm === "approveDeletion"
              ? "Delete account"
              : "Decline request"
        }
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </Card>
  );
}
