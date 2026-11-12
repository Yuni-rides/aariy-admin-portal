"use client";

import { useEffect, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Pagination } from "@/components/ui/Pagination";
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
import { downloadCsv } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useUsersStore } from "../users.store";
import { UserType, UserView } from "../users.types";
import {
  USER_TYPE_OPTIONS,
  USER_VIEWS,
  formatDate,
  getUserBadge,
  hasDeletionRequest,
  userTypeLabelMap,
} from "../users.helpers";
import { UserDetailPanel } from "./UserDetailPanel";

const ALL = "ALL";
const PAGE_SIZE = 10;

type Result = { success: boolean; message: string };

export default function UsersListPage() {
  const {
    users,
    allUsers,
    total,
    limit,
    loading,
    saving,
    fetchUsers,
    suspendUser,
    reactivateUser,
    signOutEverywhere,
    approveDeletion,
    declineDeletion,
  } = useUsersStore();

  const [view, setView] = useState<UserView>("ALL");
  const [type, setType] = useState<UserType | typeof ALL>(ALL);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Any filter change starts again from the first page.
  useEffect(() => {
    setPage(1);
  }, [view, type, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers(
        page,
        PAGE_SIZE,
        { view, type: type === ALL ? undefined : type },
        search,
      );
    }, 250);
    return () => clearTimeout(t);
  }, [page, view, type, search, fetchUsers]);

  // Keep the side panel on a row that is visible in the current view.
  useEffect(() => {
    if (!users.some((u) => u.id === selectedId)) {
      setSelectedId(users[0]?.id ?? null);
    }
  }, [users, selectedId]);

  const selected = allUsers.find((u) => u.id === selectedId);
  const deletionCount = allUsers.filter(hasDeletionRequest).length;

  const notify = (res: Result) => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res;
  };

  const handleExport = () => {
    downloadCsv(
      "aariy-users.csv",
      ["Name", "Email", "Mobile", "Type", "Orders", "Status", "Joined"],
      users.map((u) => [
        u.name,
        u.email,
        u.mobile,
        userTypeLabelMap[u.type],
        u.ordersCount,
        getUserBadge(u).label,
        formatDate(u.createdAt),
      ]),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-[13px] text-muted-foreground">
            Buyer and seller accounts. Staff are managed under Staff.
          </p>
        </div>
        <Button
          variant="secondary"
          className="min-h-11 cursor-pointer rounded-[10px]"
          onClick={handleExport}
          disabled={users.length === 0}
        >
          <Download /> Export CSV
        </Button>
      </div>

      {/* Views */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {USER_VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={cn(
              "min-h-11 cursor-pointer rounded-[10px] border px-3.5 text-sm font-medium",
              view === v.value
                ? "border-foreground bg-foreground text-white"
                : "border-input bg-white hover:bg-muted",
            )}
          >
            {v.label}
            {v.value === "DELETION_REQUESTED" && deletionCount > 0 ? ` · ${deletionCount}` : ""}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="user-search" className="mb-1.5 block text-[13px] font-normal text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="user-search"
              className="h-11 rounded-[10px] bg-white pl-9"
              placeholder="Name, email or mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <FilterSelect
          label="Account type"
          value={type}
          options={USER_TYPE_OPTIONS}
          onChange={(v) => setType(v as UserType | typeof ALL)}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl p-[18px] shadow-none lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">Loading...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const badge = getUserBadge(u);
                  return (
                    <TableRow
                      key={u.id}
                      tabIndex={0}
                      aria-selected={u.id === selectedId}
                      className={cn("cursor-pointer", u.id === selectedId && "bg-accent/50")}
                      onClick={() => setSelectedId(u.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(u.id);
                        }
                      }}
                    >
                      <TableCell>
                        <p className="font-medium">{u.name}</p>
                        <p className="max-w-[220px] truncate text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{u.mobile}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {u.type === "SELLER" ? (
                          <StatusBadge tone="info">{u.sellerName ?? "Seller"}</StatusBadge>
                        ) : (
                          "Buyer"
                        )}
                      </TableCell>
                      <TableCell>{u.type === "BUYER" ? u.ordersCount : "—"}</TableCell>
                      <TableCell>
                        <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(u.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
        </Card>

        {selected ? (
          <UserDetailPanel
            user={selected}
            saving={saving}
            onSuspend={async (reason) => notify(await suspendUser(selected.id, reason))}
            onReactivate={async () => notify(await reactivateUser(selected.id))}
            onSignOutEverywhere={async () => notify(await signOutEverywhere(selected.id))}
            onApproveDeletion={async () => notify(await approveDeletion(selected.id))}
            onDeclineDeletion={async () => notify(await declineDeletion(selected.id))}
          />
        ) : (
          <Card className="rounded-2xl p-8 text-center text-sm text-muted-foreground shadow-none">
            No user selected.
          </Card>
        )}
      </div>
    </div>
  );
}
