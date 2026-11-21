export type PermissionMap = Record<string, boolean>;

export function buildPermissionMap(permissions: string[]): PermissionMap {
  return permissions.reduce((acc, permission) => {
    acc[permission] = true;
    return acc;
  }, {} as PermissionMap);
}