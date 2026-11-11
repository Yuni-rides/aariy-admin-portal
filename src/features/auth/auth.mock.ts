// TEMPORARY: test login until the Aariy auth API is ready.
// Turn on with NEXT_PUBLIC_AUTH_BYPASS=true in .env.local.
// Delete this file (and the AUTH_BYPASS branches in auth.store.ts / LoginPage.tsx)
// once the real login is wired.
import { AuthUser, PermissionMap } from "./auth.types";

export const AUTH_BYPASS = process.env.NEXT_PUBLIC_AUTH_BYPASS === "true";

export const MOCK_ACCESS_TOKEN = "dev-bypass-token";

export const buildMockUser = (email: string): AuthUser => ({
  id: "dev-super-admin",
  email: email || "admin@aariy.test",
  firstName: "Test",
  lastName: "Admin",
  role: "SUPER_ADMIN",
  permissions: {} as PermissionMap,
  company: null,
});
