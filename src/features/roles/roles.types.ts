export type PermissionAction =
  | "VIEW"
  | "CREATE"
  | "EDIT"
  | "DELETE"
  | "APPROVE"
  | "PUBLISH"
  | "EXPORT"
  | "MANAGE";

/** One per sidebar item; the sidebar and every API call follow these permissions. */
export type ModuleKey =
  | "DASHBOARD"
  | "CATEGORIES"
  | "SELLERS"
  | "PRODUCTS"
  | "USERS"
  | "ORDERS"
  | "TIERS"
  | "STAFF"
  | "ROLES"
  | "SETTINGS";

export type PermissionMatrix = Partial<Record<ModuleKey, PermissionAction[]>>;

export type Role = {
  /** Built-in roles use fixed ids (ADMIN, CSR…); custom roles get generated ids. */
  id: string;
  name: string;
  description?: string;
  /** Built-in roles can't be renamed or deleted, only their permissions changed. */
  isSystem: boolean;
  permissions: PermissionMatrix;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

export type CreateRoleDto = {
  name: string;
  description?: string;
  /** Start from another role's permissions. */
  copyFromId?: string | null;
};

export type RolesResponse = {
  status: boolean;
  message: string;
  data?: { rows: Role[] };
};
