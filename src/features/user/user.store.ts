import { create } from "zustand";
import { useAuthStore } from "@/features/auth/auth.store";
import { ChangePasswordDto, UpdateProfileDto } from "./user.types";

type Result = { success: boolean; message: string };

type UserStore = {
  saving: boolean;
  changingPassword: boolean;

  updateProfile: (dto: UpdateProfileDto) => Promise<Result>;
  changePassword: (dto: ChangePasswordDto) => Promise<Result>;
};

export const useUserStore = create<UserStore>((set) => ({
  saving: false,
  changingPassword: false,

  updateProfile: async (dto) => {
    set({ saving: true });
    try {
      // TODO(api): const res = await userApi.updateProfile(dto);
      // The signed-in user lives in the auth store, so keep it in sync.
      const user = useAuthStore.getState().user;
      if (user) useAuthStore.setState({ user: { ...user, ...dto } });
      set({ saving: false });
      return { success: true, message: "Profile updated" };
    } catch (e: any) {
      set({ saving: false });
      return {
        success: false,
        message: e?.response?.data?.message ?? "Something went wrong",
      };
    }
  },

  changePassword: async (dto) => {
    set({ changingPassword: true });
    try {
      // TODO(api): const res = await userApi.changePassword(dto);
      void dto;
      set({ changingPassword: false });
      return { success: true, message: "Password changed" };
    } catch (e: any) {
      set({ changingPassword: false });
      return {
        success: false,
        message: e?.response?.data?.message ?? "Something went wrong",
      };
    }
  },
}));
