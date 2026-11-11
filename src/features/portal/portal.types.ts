export type ServiceModule = {
  id: string;
  code: "DELIVERIES" | "NEMT";
  name: string;
  logo: string;
  description: string;
};

export type GetServiceModulesResponse = {
  status: boolean;
  message: string;
  data?: {
    rows: ServiceModule[];
  };
};
