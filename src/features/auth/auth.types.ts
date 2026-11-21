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
  fullName: string;
  firstName?:string | "";
    lastName?:string | "";

  phone?: string | null;
  role: string;
  permissions: string[];
  mfaEnabled: boolean;
  lastSignInAt: string;
};

export type LoginDto = {
  email: string;
  password: string;
  fcmToken?: string;
};

export type Staff = {
  id: string;
  fullName: string;
  email: string;
  role: string;

  permissions: string[];
  mfaEnabled: boolean;
  lastSignInAt: string;

    firstName?:string | "";
    lastName?:string | "";
};
export type LoginResponse = {
  status: boolean;
  code: string;
  message: string;
  data?: {
    mfaRequired: boolean;
    accessToken: string;
    refreshToken: string;
    sessionExpiresAt: string;
    staff: Staff;
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







export type ProfileResponse = {
  status: boolean;
  code: string;
  message: string;
  data: AuthUser;
};