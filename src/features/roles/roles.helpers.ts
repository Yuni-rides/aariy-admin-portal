import { ModuleKey, PermissionAction, PermissionMatrix, Role } from "./roles.types";

/** Super admin always has full access and is not editable. */
export const SUPER_ADMIN_ROLE_ID = "SUPER_ADMIN";

export const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "VIEW", label: "View" },
  { key: "CREATE", label: "Create" },
  { key: "EDIT", label: "Edit" },
  { key: "DELETE", label: "Delete" },
  { key: "APPROVE", label: "Approve" },
  { key: "PUBLISH", label: "Publish" },
  { key: "EXPORT", label: "Export" },
  { key: "MANAGE", label: "Manage" },
];

/**
 * Modules in sidebar order, with the actions that mean something for each.
 * Other cells show as not applicable.
 */
export const MODULES: {
  key: ModuleKey;
  label: string;
  actions: PermissionAction[];
  /** What each action allows, shown as a tooltip. */
  hints?: Partial<Record<PermissionAction, string>>;
  /** Access here lets someone change who can do what. */
  sensitive?: boolean;
}[] = [
  { key: "DASHBOARD", label: "Dashboard", actions: ["VIEW", "EXPORT"] },
  {
    key: "CATEGORIES",
    label: "Categories",
    actions: ["VIEW", "CREATE", "EDIT", "DELETE", "PUBLISH"],
    hints: { PUBLISH: "Show or hide categories in the storefront menu" },
  },
  {
    key: "SELLERS",
    label: "Sellers",
    actions: ["VIEW", "CREATE", "EDIT", "APPROVE", "EXPORT"],
    hints: { APPROVE: "Approve, reject or suspend sellers after KYB" },
  },
  {
    key: "PRODUCTS",
    label: "Products",
    actions: ["VIEW", "CREATE", "EDIT", "DELETE", "APPROVE", "PUBLISH", "EXPORT"],
    hints: { APPROVE: "Approve or reject submitted products" },
  },
  {
    key: "USERS",
    label: "Users",
    actions: ["VIEW", "EDIT", "EXPORT", "MANAGE"],
    hints: { MANAGE: "Suspend, reactivate and handle deletion requests" },
  },
  {
    key: "ORDERS",
    label: "Orders",
    actions: ["VIEW", "EDIT", "APPROVE", "EXPORT", "MANAGE"],
    hints: { APPROVE: "Log confirmation calls and confirm orders", MANAGE: "Cancel orders and parcels" },
  },
  {
    key: "TIERS",
    label: "Tier Management",
    actions: ["VIEW", "CREATE", "EDIT", "APPROVE"],
    hints: { APPROVE: "Act as the second approver for tier and tax changes" },
  },
  {
    key: "STAFF",
    label: "Staff",
    actions: ["VIEW", "CREATE", "EDIT", "DELETE", "MANAGE"],
    hints: { MANAGE: "Create setup and reset links" },
    sensitive: true,
  },
  { key: "ROLES", label: "Roles & Permissions", actions: ["VIEW", "MANAGE"], sensitive: true },
  {
    key: "SETTINGS",
    label: "Settings",
    actions: ["VIEW", "EDIT", "PUBLISH"],
    hints: { PUBLISH: "Publish storefront pages and the home banner" },
  },
];

export const hasPermission = (m: PermissionMatrix, module: ModuleKey, action: PermissionAction) =>
  !!m[module]?.includes(action);

/**
 * Toggle one cell. Any action needs View, so ticking an action adds View
 * and unticking View clears the whole row.
 */
export function togglePermission(
  m: PermissionMatrix,
  module: ModuleKey,
  action: PermissionAction,
): PermissionMatrix {
  const current = new Set(m[module] ?? []);
  if (current.has(action)) {
    if (action === "VIEW") current.clear();
    else current.delete(action);
  } else {
    current.add(action);
    current.add("VIEW");
  }
  const allowed = MODULES.find((x) => x.key === module)!.actions;
  return { ...m, [module]: allowed.filter((a) => current.has(a)) };
}

/** Tick or clear every applicable action in a row. */
export function setModuleAll(m: PermissionMatrix, module: ModuleKey, on: boolean): PermissionMatrix {
  const allowed = MODULES.find((x) => x.key === module)!.actions;
  return { ...m, [module]: on ? [...allowed] : [] };
}

export const moduleState = (m: PermissionMatrix, module: ModuleKey): "all" | "some" | "none" => {
  const allowed = MODULES.find((x) => x.key === module)!.actions;
  const n = (m[module] ?? []).length;
  return n === 0 ? "none" : n >= allowed.length ? "all" : "some";
};

export const samePermissions = (a: PermissionMatrix, b: PermissionMatrix) =>
  MODULES.every((mod) => {
    const x = [...(a[mod.key] ?? [])].sort().join();
    const y = [...(b[mod.key] ?? [])].sort().join();
    return x === y;
  });

/** Short text for the Staff list, e.g. "Orders, Users (view)". Dashboard is left out as everyone has it. */
export function summarizePermissions(roleId: string, m: PermissionMatrix): string {
  if (roleId === SUPER_ADMIN_ROLE_ID) return "All";
  const listed = MODULES.filter((mod) => mod.key !== "DASHBOARD");
  const withAccess = listed.filter((mod) => (m[mod.key] ?? []).length > 0);
  if (withAccess.length === 0) return "No access";
  const missing = listed.filter((mod) => !withAccess.includes(mod));
  if (missing.length === 0) return "All";
  if (missing.length <= 2 && withAccess.length >= 6) return `All except ${missing.map((x) => x.label).join(", ")}`;
  return withAccess
    .map((mod) => {
      const acts = m[mod.key] ?? [];
      return acts.length === 1 && acts[0] === "VIEW" ? `${mod.label} (view)` : mod.label;
    })
    .join(", ");
}

export const roleName = (roles: Pick<Role, "id" | "name">[], id: string) =>
  id === SUPER_ADMIN_ROLE_ID ? "Super admin" : roles.find((r) => r.id === id)?.name ?? "Unknown role";

export const countPermissions = (m: PermissionMatrix) =>
  MODULES.reduce((n, mod) => n + (m[mod.key] ?? []).length, 0);
