import { http } from "@/shared/api/http";
import {
  LoginDto,
  LoginResponse,
  
  ProfileResponse,
  
  SetPasswordDto,
  
  SetPasswordResponse,
} from "./auth.types";

export const authApi = {
  login: async (payload: LoginDto): Promise<LoginResponse> => {
    const res = await http.post<LoginResponse>("admin/auth/login", payload);

    console.log(res.data)
    return res.data;
  },


    getProfile: async (): Promise<ProfileResponse> => {
    const res = await http.get<ProfileResponse>("admin/auth/me");

    console.log(res.data,"[get Profile]")
    return res.data;
  },

  logout: async (payload: {
    fcmToken: string;
  }): Promise<{ status: boolean; message: string }> => {
    const res = await http.post("admin/auth/logout", payload);
    console.log(res)
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
