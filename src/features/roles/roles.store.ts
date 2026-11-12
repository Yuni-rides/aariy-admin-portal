import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { CreateRoleDto, PermissionMatrix, Role } from "./roles.types";
import { ROLES_MOCK } from "./roles.mock";
import { SUPER_ADMIN_ROLE_ID } from "./roles.helpers";

type Result = { success: boolean; message: string };

type RolesStore = {
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  roles: Role[];

  fetchRoles: () => Promise<void>;
  /** Saves the permissions of every role passed in (only changed ones are sent). */
  savePermissions: (changes: Record<string, PermissionMatrix>) => Promise<Result>;
  createRole: (dto: CreateRoleDto) => Promise<Result & { id?: string }>;
  updateRoleDetails: (id: string, dto: { name: string; description?: string }) => Promise<Result>;
  /** `staffCount` comes from the staff list; a role in use can't be deleted. */
  deleteRole: (id: string, staffCount: number) => Promise<Result>;
};

const actorName = () => {
  const u = useAuthStore.getState().user;
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Super admin";
};

const validName = (roles: Role[], name: string, selfId?: string): string | null => {
  const n = name.trim();
  if (!n) return "Role name is required";
  if (n.length > 40) return "Keep the name under 40 characters";
  if (n.toLowerCase() === "super admin") return "Super admin is reserved";
  if (roles.some((r) => r.id !== selfId && r.name.toLowerCase() === n.toLowerCase()))
    return "A role with this name already exists";
  return null;
};

export const useRolesStore = create<RolesStore>((set, get) => ({
  loaded: false,
  loading: false,
  saving: false,
  error: null,
  roles: [],

  fetchRoles: async () => {
    if (get().loaded) return;
    set({ loading: true, error: null });
    try {
      // TODO(api): const res = await rolesApi.getRoles();
      set({ roles: ROLES_MOCK, loaded: true, loading: false });
    } catch (e: any) {
      set({ error: e?.response?.data?.message ?? "Something went wrong", loading: false });
    }
  },

  savePermissions: async (changes) => {
    const ids = Object.keys(changes).filter((id) => id !== SUPER_ADMIN_ROLE_ID);
    if (!ids.length) return { success: true, message: "No changes" };
    set({ saving: true });
    // TODO(api): await rolesApi.updatePermissions(changes); — sessions pick up the new permissions on next request.
    const now = new Date().toISOString();
    set({
      roles: get().roles.map((r) =>
        ids.includes(r.id) ? { ...r, permissions: changes[r.id], updatedBy: actorName(), updatedAt: now } : r,
      ),
      saving: false,
    });
    return {
      success: true,
      message: ids.length === 1 ? "Permissions saved" : `Permissions saved for ${ids.length} roles`,
    };
  },

  createRole: async (dto) => {
    const roles = get().roles;
    const error = validName(roles, dto.name);
    if (error) return { success: false, message: error };
    set({ saving: true });
    // TODO(api): const res = await rolesApi.createRole(dto);
    const source = roles.find((r) => r.id === dto.copyFromId);
    const role: Role = {
      id: `role-${Date.now()}`,
      name: dto.name.trim(),
      description: dto.description?.trim() || undefined,
      isSystem: false,
      permissions: source ? structuredClone(source.permissions) : { DASHBOARD: ["VIEW"] },
      updatedBy: actorName(),
      updatedAt: new Date().toISOString(),
    };
    set({ roles: [...roles, role], saving: false });
    return { success: true, message: `${role.name} role created`, id: role.id };
  },

  updateRoleDetails: async (id, dto) => {
    const roles = get().roles;
    const role = roles.find((r) => r.id === id);
    if (!role) return { success: false, message: "Role not found" };
    if (role.isSystem) return { success: false, message: "Built-in roles can't be renamed" };
    const error = validName(roles, dto.name, id);
    if (error) return { success: false, message: error };
    set({ saving: true });
    // TODO(api): await rolesApi.updateRole(id, dto);
    set({
      roles: roles.map((r) =>
        r.id === id ? { ...r, name: dto.name.trim(), description: dto.description?.trim() || undefined } : r,
      ),
      saving: false,
    });
    return { success: true, message: "Role updated" };
  },

  deleteRole: async (id, staffCount) => {
    const role = get().roles.find((r) => r.id === id);
    if (!role) return { success: false, message: "Role not found" };
    if (role.isSystem) return { success: false, message: "Built-in roles can't be deleted" };
    if (staffCount > 0)
      return { success: false, message: `${staffCount} staff still have this role. Move them to another role first.` };
    set({ saving: true });
    // TODO(api): await rolesApi.deleteRole(id);
    set({ roles: get().roles.filter((r) => r.id !== id), saving: false });
    return { success: true, message: `${role.name} role deleted` };
  },
}));
