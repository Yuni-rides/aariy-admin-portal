import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuditEntry, LogAuditDto } from "./audit.types";

type AuditStore = {
  entries: AuditEntry[];
  /** Records an action. TODO(api): the backend writes the audit log itself; this mirrors it locally. */
  log: (dto: LogAuditDto) => void;
};

export const auditActorName = () => {
  const u = useAuthStore.getState().user;
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Super admin";
};

export const useAuditStore = create<AuditStore>((set) => ({
  entries: [],
  log: (dto) =>
    set((s) => ({
      entries: [
        {
          ...dto,
          id: `audit-${Date.now()}-${s.entries.length}`,
          actor: auditActorName(),
          createdAt: new Date().toISOString(),
        },
        ...s.entries,
      ],
    })),
}));
