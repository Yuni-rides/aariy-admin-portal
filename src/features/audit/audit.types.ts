/** What kind of thing happened; drives the filter on the audit log page. */
export type AuditCategory = "DATA_ACCESS" | "SELLER" | "PAYOUT" | "ORDER" | "SETTINGS" | "STAFF";

export type AuditEntry = {
  id: string;
  category: AuditCategory;
  /** Short past-tense line, e.g. "Revealed buyer phone". */
  action: string;
  /** What it was done to, e.g. "Order ARY-1042". */
  target: string;
  actor: string;
  reason?: string | null;
  createdAt: string;
};

export type LogAuditDto = Omit<AuditEntry, "id" | "actor" | "createdAt">;
