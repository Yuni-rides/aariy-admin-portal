"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
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
import { useCategoriesStore } from "@/features/categories/categories.store";
import { formatCategoryPath, getCategoryPath } from "@/features/categories/categories.helpers";
import { useSellersStore } from "@/features/sellers/sellers.store";
import { currentAdminName, useTiersStore } from "../tiers.store";
import { Approval, CommissionRule, TaxRule } from "../tiers.types";
import {
  commissionScopeLabelMap,
  commissionTarget,
  formatDay,
  formatRate,
  getRuleBadge,
  isPendingApproval,
  resolveCommission,
  sellerTypeLabelMap,
  sortRules,
} from "../tiers.helpers";
import { CommissionRuleModal } from "./CommissionRuleModal";
import { TaxRuleModal } from "./TaxRuleModal";

type Result = { success: boolean; message: string };
type RuleLike = { status: string; effectiveFrom: string; effectiveTo?: string | null; approval?: Approval | null };

const NONE = "__none__";

function StatusCell({ rule }: { rule: RuleLike }) {
  const badge = getRuleBadge(rule);
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
      {isPendingApproval(rule) && (
        <span className="text-xs text-muted-foreground">by {rule.approval!.requestedBy}</span>
      )}
      {rule.approval?.status === "REJECTED" && rule.approval.reason && (
        <span className="max-w-[220px] text-xs text-destructive">{rule.approval.reason}</span>
      )}
    </div>
  );
}

function DateCell({ rule }: { rule: RuleLike }) {
  return (
    <div className="whitespace-nowrap">
      {formatDay(rule.effectiveFrom)}
      {rule.effectiveTo && (
        <p className="text-xs text-muted-foreground">until {formatDay(rule.effectiveTo)}</p>
      )}
    </div>
  );
}

/** Approve / reject for pending rows, edit for everything else that isn't retired. */
function RowActions({
  rule,
  saving,
  onApprove,
  onReject,
  onEdit,
}: {
  rule: RuleLike;
  saving: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
}) {
  if (rule.status === "RETIRED") return null;
  if (isPendingApproval(rule)) {
    const own = rule.approval!.requestedBy === currentAdminName();
    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          disabled={saving || own}
          title={own ? "You requested this change; another admin has to approve it" : undefined}
          className="cursor-pointer rounded-[10px]"
          onClick={onApprove}
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={saving}
          className="cursor-pointer rounded-[10px]"
          onClick={onReject}
        >
          {own ? "Withdraw" : "Reject"}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <Button size="sm" variant="secondary" className="cursor-pointer rounded-[10px]" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

function HistoryToggle({ id, count, checked, onChange }: { id: string; count: number; checked: boolean; onChange: (v: boolean) => void }) {
  if (count === 0) return null;
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="h-4 w-4 rounded" />
      Show retired ({count})
    </label>
  );
}

export default function TiersPage() {
  const {
    commissionRules,
    taxRules,
    loading,
    saving,
    fetchTiers,
    saveCommissionRule,
    approveCommissionRule,
    rejectCommissionRule,
    saveTaxRule,
    approveTaxRule,
    rejectTaxRule,
  } = useTiersStore();
  const { allSellers, fetchSellers } = useSellersStore();
  const { categories, fetchCategories } = useCategoriesStore();

  const [commissionModal, setCommissionModal] = useState<{ rule?: CommissionRule } | null>(null);
  const [taxModal, setTaxModal] = useState<{ rule?: TaxRule } | null>(null);
  const [rejecting, setRejecting] = useState<{ kind: "commission" | "tax"; id: string; own: boolean } | null>(null);
  const [showRetiredCommission, setShowRetiredCommission] = useState(false);
  const [showRetiredTax, setShowRetiredTax] = useState(false);
  const [checkSeller, setCheckSeller] = useState(NONE);
  const [checkCategory, setCheckCategory] = useState(NONE);

  useEffect(() => {
    fetchTiers();
    fetchSellers();
    fetchCategories();
  }, [fetchTiers, fetchSellers, fetchCategories]);

  const notify = (res: Result) => {
    toast(
      res.success
        ? { title: res.message }
        : { variant: "destructive", title: "Action failed", description: res.message },
    );
    return res;
  };

  const visibleCommission = useMemo(
    () => sortRules(commissionRules.filter((r) => showRetiredCommission || r.status !== "RETIRED")),
    [commissionRules, showRetiredCommission],
  );
  const visibleTax = useMemo(
    () => sortRules(taxRules.filter((r) => showRetiredTax || r.status !== "RETIRED")),
    [taxRules, showRetiredTax],
  );
  const pendingCount = [...commissionRules, ...taxRules].filter(isPendingApproval).length;

  const categoryOptions = useMemo(
    () => [
      { value: NONE, label: "Any category" },
      ...categories
        .map((c) => ({ value: c.id, label: formatCategoryPath(getCategoryPath(categories, c.id)) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ],
    [categories],
  );
  const sellerOptions = useMemo(
    () => [{ value: NONE, label: "Any seller" }, ...allSellers.map((s) => ({ value: s.id, label: s.name }))],
    [allSellers],
  );

  const applied = resolveCommission(
    commissionRules,
    categories,
    checkSeller === NONE ? null : checkSeller,
    checkCategory === NONE ? null : checkCategory,
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tier Management</h1>
          {pendingCount > 0 && (
            <p className="text-[13px] text-muted-foreground">
              {pendingCount} {pendingCount === 1 ? "change is" : "changes are"} waiting for a second approver
            </p>
          )}
        </div>
        <Button className="min-h-11 cursor-pointer rounded-[10px]" onClick={() => setCommissionModal({})}>
          <Plus /> New tier
        </Button>
      </div>

      {/* Commission tiers */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Commission tiers</h2>
            <p className="text-[13px] text-muted-foreground">
              Applied per suborder. Priority: seller, category, default.
            </p>
          </div>
          <HistoryToggle
            id="retired-commission"
            count={commissionRules.filter((r) => r.status === "RETIRED").length}
            checked={showRetiredCommission}
            onChange={setShowRetiredCommission}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Tier</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && commissionRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center">Loading...</TableCell>
              </TableRow>
            ) : visibleCommission.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center">No commission tiers yet</TableCell>
              </TableRow>
            ) : (
              visibleCommission.map((r) => (
                <TableRow key={r.id} className={r.status === "RETIRED" ? "text-muted-foreground" : undefined}>
                  <TableCell className="font-medium">{commissionScopeLabelMap[r.scope]}</TableCell>
                  <TableCell>{commissionTarget(r)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRate(r.rateBps)}</TableCell>
                  <TableCell><DateCell rule={r} /></TableCell>
                  <TableCell><StatusCell rule={r} /></TableCell>
                  <TableCell>
                    <RowActions
                      rule={r}
                      saving={saving}
                      onApprove={async () => notify(await approveCommissionRule(r.id))}
                      onReject={() =>
                        setRejecting({ kind: "commission", id: r.id, own: r.approval?.requestedBy === currentAdminName() })
                      }
                      onEdit={() => setCommissionModal({ rule: r })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Rate check */}
      <Card className="flex flex-col gap-3 rounded-2xl p-[18px] shadow-none">
        <div>
          <h2 className="text-[15px] font-semibold">Check a rate</h2>
          <p className="text-[13px] text-muted-foreground">
            See which tier applies today to a seller and category.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect label="Seller" value={checkSeller} options={sellerOptions} onChange={setCheckSeller} />
          <FilterSelect label="Category" value={checkCategory} options={categoryOptions} onChange={setCheckCategory} />
          <div className="flex min-h-11 min-w-[200px] flex-1 items-center rounded-[10px] bg-accent px-4 py-2 text-sm" aria-live="polite">
            {applied ? (
              <span>
                <span className="text-lg font-semibold">{formatRate(applied.rateBps)}</span>{" "}
                <span className="text-muted-foreground">
                  from {commissionScopeLabelMap[applied.scope].toLowerCase()}
                  {applied.scope !== "DEFAULT" && ` (${commissionTarget(applied)})`}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">No active tier applies</span>
            )}
          </div>
        </div>
      </Card>

      {/* Tax rules */}
      <Card className="rounded-2xl p-[18px] shadow-none">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Tax rules</h2>
            <p className="text-[13px] text-muted-foreground">Rate set from the tax adviser&apos;s opinion</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <HistoryToggle
              id="retired-tax"
              count={taxRules.filter((r) => r.status === "RETIRED").length}
              checked={showRetiredTax}
              onChange={setShowRetiredTax}
            />
            <Button
              variant="secondary"
              className="min-h-11 cursor-pointer rounded-[10px]"
              onClick={() => setTaxModal({})}
            >
              <Plus /> New tax rule
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Province</TableHead>
              <TableHead>Seller type</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTax.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center">No tax rules yet</TableCell>
              </TableRow>
            ) : (
              visibleTax.map((r) => (
                <TableRow key={r.id} className={r.status === "RETIRED" ? "text-muted-foreground" : undefined}>
                  <TableCell className="font-medium">{r.province}</TableCell>
                  <TableCell>{sellerTypeLabelMap[r.sellerType]}</TableCell>
                  <TableCell>{r.taxType}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatRate(r.rateBps)}</TableCell>
                  <TableCell><DateCell rule={r} /></TableCell>
                  <TableCell><StatusCell rule={r} /></TableCell>
                  <TableCell>
                    <RowActions
                      rule={r}
                      saving={saving}
                      onApprove={async () => notify(await approveTaxRule(r.id))}
                      onReject={() =>
                        setRejecting({ kind: "tax", id: r.id, own: r.approval?.requestedBy === currentAdminName() })
                      }
                      onEdit={() => setTaxModal({ rule: r })}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <p className="text-[13px] text-muted-foreground">
        Changes only apply to new orders. Every change needs a second approver and is logged.
      </p>

      <CommissionRuleModal
        open={commissionModal !== null}
        rule={commissionModal?.rule}
        sellers={allSellers}
        categories={categories}
        saving={saving}
        onClose={() => setCommissionModal(null)}
        onSave={async (dto, meta) => notify(await saveCommissionRule(dto, meta, commissionModal?.rule?.id))}
      />

      <TaxRuleModal
        open={taxModal !== null}
        rule={taxModal?.rule}
        saving={saving}
        onClose={() => setTaxModal(null)}
        onSave={async (dto) => notify(await saveTaxRule(dto, taxModal?.rule?.id))}
      />

      <ReasonDialog
        open={rejecting !== null}
        saving={saving}
        title={rejecting?.own ? "Withdraw this change?" : "Reject this change?"}
        description={
          rejecting?.own
            ? "It goes back to you as rejected. You can edit and submit it again."
            : "The requester sees your reason and can edit and submit it again."
        }
        confirmLabel={rejecting?.own ? "Withdraw" : "Reject change"}
        requiredMessage="Add a reason. It is kept in the audit log."
        onClose={() => setRejecting(null)}
        onConfirm={async (reason) => {
          if (!rejecting) return false;
          const res = notify(
            rejecting.kind === "commission"
              ? await rejectCommissionRule(rejecting.id, reason)
              : await rejectTaxRule(rejecting.id, reason),
          );
          return res.success;
        }}
      />
    </div>
  );
}
