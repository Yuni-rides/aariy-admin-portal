import axios from "axios";
import { env } from "@/core/env/env";
import { useAuthStore } from "@/features/auth/auth.store";

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

export const httpUpload = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  timeout: 0,
});

const addTokenInterceptor = (config: any) => {
  if (typeof window !== "undefined") {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

http.interceptors.request.use(addTokenInterceptor);
httpUpload.interceptors.request.use(addTokenInterceptor);
