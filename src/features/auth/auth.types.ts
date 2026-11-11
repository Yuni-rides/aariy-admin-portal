export type PermissionCode =
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CREATE_COMPANY"
  | "UPDATE_COMPANY"
  | "UPDATE_COMPANY_STATUS"
  | "DELETE_COMPANY"
  | "GET_COMPANIES"
  | "CREATE_DRIVERS"
  | "UPDATE_DRIVERS"
  | "DELETE_DRIVERS"
  | "GET_DRIVERS"
  | "CREATE_TRIPS"
  | "UPDATE_TRIPS"
  | "GET_TRIPS"
  | "DELETE_TRIPS"
  | "GET_DISTRICTS"
  | "GET_PEOPLE"
  | "GET_CHAT"
  | "GET_TRAINING_MODULE"
  | "UPDATE_INCIDENT"
  | "ASSIGN_VENDOR"
  | "ASSIGN_DRIVER"
  | "CREATE_INVENTORY"
  | "UPDATE_INVENTORY"
  | "DELETE_INVENTORY"
  | "RETURN_ITEM"
  | "ASSIGNED_VENDORS"
  | "CONFIRM_VENDOR_RETURN"
  | "CONFIRM_DRIVER_RETURN";

export type PermissionMap = Record<PermissionCode, boolean>;

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: string;
  permissions: PermissionMap;
  company: {
    id: string;
    name: string;
    status: string;
  } | null;
};

export type LoginDto = {
  email: string;
  password: string;
  fcmToken?: string;
};

export type LoginResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    status: boolean;
    accessToken: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: {
        code: string;
        permissions: {
          allowed: boolean;
          feature: { code: string };
        }[];
      };
      company: {
        id: string;
        name: string;
        status: string;
      } | null;
    };
  };
};

export type SetPasswordDto = {
  token: string;
  password: string;
};

export type SetPasswordResponse = {
  status: boolean;
  message: string;
};
