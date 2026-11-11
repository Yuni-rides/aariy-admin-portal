export const roleLabelMap: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  OWNER: "Owner",
  STAFF: "Staff",
};

export const getRoleLabel = (role?: string) =>
  (role && roleLabelMap[role]) ||
  (role ? role.replace(/_/g, " ").toLowerCase() : "—");

export const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SA";

export const MIN_PASSWORD_LENGTH = 8;

/** Returns an error message, or null when the password is acceptable. */
export function validateNewPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
    return "Use both letters and numbers";
  return null;
}
