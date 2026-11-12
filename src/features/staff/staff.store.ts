import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { InviteStaffDto, IssuedLink, SetupLinkKind, StaffMember, StaffRole } from "./staff.types";
import { STAFF_MOCK } from "./staff.mock";
import { useRolesStore } from "@/features/roles/roles.store";
import { SUPER_ADMIN_ROLE_ID, roleName } from "@/features/roles/roles.helpers";
import { LINK_TTL_HOURS, isValidEmail } from "./staff.helpers";

type Result = { success: boolean; message: string };
type LinkResult = Result & { link?: IssuedLink };

type StaffStore = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  staff: StaffMember[];

  fetchStaff: () => Promise<void>;
  inviteStaff: (dto: InviteStaffDto) => Promise<LinkResult>;
  /** New setup link for a pending invite, or a password reset link for an active member. */
  issueLink: (id: string) => Promise<LinkResult>;
  changeRole: (id: string, role: StaffRole) => Promise<Result>;
  deactivate: (id: string) => Promise<Result>;
  reactivate: (id: string) => Promise<Result>;
  revokeInvite: (id: string) => Promise<Result>;
};

const currentUser = () => useAuthStore.getState().user;
const actorName = () => {
  const u = currentUser();
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Super admin";
};

/** Rows that belong to the signed-in admin, who can't change or switch off their own access. */
export const isCurrentUser = (m: Pick<StaffMember, "email" | "name">) => {
  const u = currentUser();
  return !!u && (m.email.toLowerCase() === u.email?.toLowerCase() || m.name === actorName());
};

const makeLink = (m: StaffMember, kind: SetupLinkKind): IssuedLink => {
  // TODO(api): the backend creates the token and returns the link; this is a stand-in.
  const token = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    kind,
    staffName: m.name,
    email: m.email,
    url: `${origin}/set-password?token=${token}`,
    expiresAt: new Date(Date.now() + LINK_TTL_HOURS * 3600_000).toISOString(),
  };
};

export const useStaffStore = create<StaffStore>((set, get) => {
  const source = () => (get().staff.length ? get().staff : STAFF_MOCK);
  const find = (id: string) => source().find((m) => m.id === id);
  const patch = (id: string, changes: Partial<StaffMember>) =>
    set({ staff: source().map((m) => (m.id === id ? { ...m, ...changes } : m)) });

  const activeSuperAdmins = () =>
    source().filter((m) => m.role === SUPER_ADMIN_ROLE_ID && m.status === "ACTIVE").length;

  return {
    loading: false,
    saving: false,
    error: null,
    staff: [],

    fetchStaff: async () => {
      set({ loading: true, error: null });
      try {
        // TODO(api): const res = await staffApi.getStaff();
        set({ staff: source(), loading: false });
      } catch (e: any) {
        set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
      }
    },

    inviteStaff: async (dto) => {
      const name = dto.name.trim();
      const email = dto.email.trim().toLowerCase();
      if (!name) return { success: false, message: "Name is required" };
      if (!isValidEmail(email)) return { success: false, message: "Enter a valid email" };
      const roles = useRolesStore.getState().roles;
      if (dto.role === SUPER_ADMIN_ROLE_ID || !roles.some((r) => r.id === dto.role))
        return { success: false, message: "Choose a role" };
      if (source().some((m) => m.email.toLowerCase() === email))
        return { success: false, message: "Someone with this email is already on the staff list" };

      set({ saving: true });
      // TODO(api): const res = await staffApi.invite({ name, email, role });
      const member: StaffMember = {
        id: `staff-${Date.now()}`,
        name,
        email,
        role: dto.role,
        status: "PENDING",
        lastLoginAt: null,
        invitedBy: actorName(),
        invitedAt: new Date().toISOString(),
      };
      const link = makeLink(member, "SETUP");
      member.linkExpiresAt = link.expiresAt;
      set({ staff: [...source(), member], saving: false });
      return { success: true, message: `${name} invited as ${roleName(roles, dto.role)}`, link };
    },

    issueLink: async (id) => {
      const m = find(id);
      if (!m) return { success: false, message: "Staff member not found" };
      if (m.status === "DEACTIVATED") return { success: false, message: "Reactivate this account first" };
      set({ saving: true });
      const kind: SetupLinkKind = m.status === "PENDING" ? "SETUP" : "RESET";
      // TODO(api): await staffApi.issueLink(id, kind) — any older link stops working.
      const link = makeLink(m, kind);
      patch(id, { linkExpiresAt: link.expiresAt });
      set({ saving: false });
      return {
        success: true,
        message: kind === "SETUP" ? "New setup link created" : "Password reset link created",
        link,
      };
    },

    changeRole: async (id, role) => {
      const m = find(id);
      if (!m) return { success: false, message: "Staff member not found" };
      if (isCurrentUser(m)) return { success: false, message: "You can't change your own role" };
      if (m.role === SUPER_ADMIN_ROLE_ID && activeSuperAdmins() <= 1)
        return { success: false, message: "There must always be at least one super admin" };
      if (role === m.role) return { success: true, message: "No change" };
      if (role === SUPER_ADMIN_ROLE_ID) return { success: false, message: "Super admin can't be given from here" };
      set({ saving: true });
      // TODO(api): await staffApi.changeRole(id, role);
      patch(id, { role });
      set({ saving: false });
      return { success: true, message: `${m.name} is now ${roleName(useRolesStore.getState().roles, role)}` };
    },

    deactivate: async (id) => {
      const m = find(id);
      if (!m || m.status !== "ACTIVE") return { success: false, message: "Only active accounts can be deactivated" };
      if (isCurrentUser(m)) return { success: false, message: "You can't deactivate your own account" };
      if (m.role === SUPER_ADMIN_ROLE_ID && activeSuperAdmins() <= 1)
        return { success: false, message: "There must always be at least one super admin" };
      set({ saving: true });
      // TODO(api): await staffApi.deactivate(id); — also ends their sessions.
      patch(id, { status: "DEACTIVATED", linkExpiresAt: null });
      set({ saving: false });
      return { success: true, message: `${m.name} can no longer sign in` };
    },

    reactivate: async (id) => {
      const m = find(id);
      if (!m || m.status !== "DEACTIVATED") return { success: false, message: "This account isn't deactivated" };
      set({ saving: true });
      // TODO(api): await staffApi.reactivate(id);
      patch(id, { status: "ACTIVE" });
      set({ saving: false });
      return { success: true, message: `${m.name} reactivated` };
    },

    revokeInvite: async (id) => {
      const m = find(id);
      if (!m || m.status !== "PENDING") return { success: false, message: "Only pending invites can be revoked" };
      set({ saving: true });
      // TODO(api): await staffApi.revokeInvite(id);
      set({ staff: source().filter((x) => x.id !== id), saving: false });
      return { success: true, message: `Invite for ${m.email} revoked` };
    },
  };
});
