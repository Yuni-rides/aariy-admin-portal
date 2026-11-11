import { http } from "@/shared/api/http";
import {
  LoginDto,
  LoginResponse,
  SetPasswordDto,
  SetPasswordResponse,
} from "./auth.types";

export const authApi = {
  login: async (payload: LoginDto): Promise<LoginResponse> => {
    const res = await http.post<LoginResponse>("/auth/login", payload);
    return res.data;
  },

  logout: async (payload: {
    fcmToken: string;
  }): Promise<{ status: boolean; message: string }> => {
    const res = await http.post("/auth/logout", payload);
    return res.data;
  },

  setPassword: async (
    payload: SetPasswordDto,
  ): Promise<SetPasswordResponse> => {
    const res = await http.post<SetPasswordResponse>(
      "/user/set-password",
      payload,
    );
    return res.data;
  },
};
