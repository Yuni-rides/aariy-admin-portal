import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "./auth.api";
import { AuthUser, LoginDto, SetPasswordDto } from "./auth.types";
import { buildPermissionMap } from "./permission.utils";
import Cookies from "js-cookie";
import { AUTH_BYPASS, MOCK_ACCESS_TOKEN, buildMockUser } from "./auth.mock";

type AuthStore = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;

  login: (dto: LoginDto) => Promise<{ success: boolean; message: string }>;
  logout: (fcmToken: string) => Promise<void>;
  setPassword: (
    dto: SetPasswordDto,
  ) => Promise<{ success: boolean; message: string }>;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      loading: false,
      error: null,

      login: async (dto) => {
        set({ loading: true, error: null });

        // TEMPORARY: accept any email/password until the auth API is ready.
        if (AUTH_BYPASS) {
          Cookies.set("token", MOCK_ACCESS_TOKEN, { expires: 1, sameSite: "lax" });
          set({
            user: buildMockUser(dto.email),
            accessToken: MOCK_ACCESS_TOKEN,
            loading: false,
          });
          return { success: true, message: "Logged in (test mode)" };
        }

        try {
          const res = await authApi.login(dto);

          if (!res.status || !res.data) {
            const message = res.message ?? "Invalid email or password";
            set({ loading: false, error: message });
            return { success: false, message };
          }

          const apiUser = res.data.user;
          const role = apiUser.role;

          const permissions = buildPermissionMap(role.permissions);

          const user: AuthUser = {
            id: apiUser.id,
            email: apiUser.email,
            firstName: apiUser.firstName,
            lastName: apiUser.lastName,
            role: role.code,
            permissions,
            company: apiUser.company ?? null,
          };

          const token = res.data.accessToken;

          Cookies.set("token", token, {
            expires: 1, // 1 day
            sameSite: "lax",
          });

          set({
            user,
            accessToken: token,
            loading: false,
          });

          return { success: true, message: res.message };
        } catch (e: any) {
          const message = e?.response?.data?.message ?? "Login failed";
          set({ loading: false, error: message });
          return { success: false, message };
        }
      },

      logout: async (fcmToken: string) => {
        try {
          if (!AUTH_BYPASS) await authApi.logout({ fcmToken });
        } catch (error) {
          console.error("Logout API failed", error);
        } finally {
          Cookies.remove("token");
          localStorage.removeItem("auth-storage");
          set({ user: null, accessToken: null });

          window.location.href = "/login";
        }
      },

      setPassword: async (dto) => {
        set({ loading: true, error: null });
        try {
          const res = await authApi.setPassword(dto);
          set({ loading: false });
          return { success: res.status, message: res.message };
        } catch (e: any) {
          const message =
            e?.response?.data?.message ?? "Failed to set password";
          set({ loading: false, error: message });
          return { success: false, message };
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
