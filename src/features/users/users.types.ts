/** Staff accounts live in the Staff module, so Users covers buyers and seller accounts. */
export type UserType = "BUYER" | "SELLER";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

/** List views; "deletion requested" is an active account with a pending request. */
export type UserView = "ALL" | "ACTIVE" | "SUSPENDED" | "DELETION_REQUESTED" | "DELETED";

export type UserAddress = {
  id: string;
  line1: string;
  city: string;
  province: string;
  postalCode?: string;
  phone: string;
  isDefault: boolean;
};

export type PlatformUser = {
  id: string;
  name: string;
  /** Login identity; sign-in is by email OTP, so there is no password to reset. */
  email: string;
  /** Used for the CSR order-confirmation call, not for login. */
  mobile: string;
  type: UserType;
  status: UserStatus;
  market: string;
  locale: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  lastActiveAt?: string | null;
  activeSessions: number;
  addresses: UserAddress[];
  /** For seller accounts: the seller they belong to. */
  sellerId?: string;
  sellerName?: string;
  suspendedAt?: string | null;
  suspendReason?: string | null;
  deletionRequestedAt?: string | null;
  createdAt: string;
};

export type UsersFilter = {
  view?: UserView;
  type?: UserType;
};

export type UsersResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: PlatformUser[];
    meta: { total: number; page: number; limit: number };
  };
};
