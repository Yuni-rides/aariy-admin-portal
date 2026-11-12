/**
 * A role id from Roles & Permissions (built-in ids like "CSR", or a custom role id).
 * "SUPER_ADMIN" has full access; every other role gets only its permissions.
 */
export type StaffRole = string;

/** PENDING = invited, setup link not used yet. */
export type StaffStatus = "ACTIVE" | "PENDING" | "DEACTIVATED";

export type SetupLinkKind = "SETUP" | "RESET";

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  lastLoginAt?: string | null;
  invitedBy?: string | null;
  invitedAt: string;
  /** When the latest setup / reset link stops working. */
  linkExpiresAt?: string | null;
};

export type InviteStaffDto = {
  name: string;
  email: string;
  /** Any role except super admin. */
  role: StaffRole;
};

/** A one-time link returned after invite or reset; shown once so staff can send it on. */
export type IssuedLink = {
  kind: SetupLinkKind;
  staffName: string;
  email: string;
  url: string;
  expiresAt: string;
};

export type StaffResponse = {
  status: boolean;
  message: string;
  data?: { rows: StaffMember[] };
};
