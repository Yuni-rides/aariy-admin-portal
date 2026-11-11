import { useAuthStore } from "./auth.store";
import { PermissionCode } from "./auth.types";

export function usePermission(code: PermissionCode): boolean;
export function usePermission(): {
  hasPermission: (code: PermissionCode) => boolean;
};

export function usePermission(code?: PermissionCode) {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (pCode: PermissionCode): boolean => {
    return Boolean(user?.permissions?.[pCode]);
  };

  if (code) {
    return hasPermission(code);
  }

  return { hasPermission };
}
