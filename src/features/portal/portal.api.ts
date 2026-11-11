import { http } from "@/shared/api/http";
import { GetServiceModulesResponse } from "./portal.types";

export const portalApi = {
  getServiceModules: async (): Promise<GetServiceModulesResponse> => {
    const res = await http.get<GetServiceModulesResponse>("/operations");
    return res.data;
  },
};
