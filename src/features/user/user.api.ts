import { http } from "@/shared/api/http";
import {
    ChangePasswordDto,
  ChangePasswordResponse,

} from "./user.types";

export const userApi = {
  changePassword: async (payload: ChangePasswordDto): Promise<ChangePasswordResponse> => {
    const res = await http.post<ChangePasswordResponse>("admin/auth/password/change", payload);

    console.log(res.data,"USER PRoFILE")
    return res.data;
  },



}