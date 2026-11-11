import { PermissionMap } from "./auth.types";

export function buildPermissionMap(
  permissions: {
    allowed: boolean;
    feature: { code: string };
  }[]
): PermissionMap {
  return permissions.reduce((acc, p) => {
    acc[p.feature.code as keyof PermissionMap] = p.allowed;
    return acc;
  }, {} as PermissionMap);
}
