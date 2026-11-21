import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { env } from "@/core/env/env";
import { useAuthStore } from "@/features/auth/auth.store";



type RefreshTokenResponse = {
  status: boolean;
  code: string;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    sessionExpiresAt: string;
  };
};

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
    

    console.log(token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};


let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else if (token) prom.resolve(token);
  });
  failedQueue = [];
};


// 2. Response Interceptor: 401 aane par /admin/auth/refresh hit karein
const attachRefreshInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/admin/auth/refresh") &&
        !originalRequest.url?.includes("/admin/auth/login")
      ) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return instance(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const currentRefreshToken = useAuthStore.getState().refreshToken;

          const res = await axios.post<RefreshTokenResponse>(
            `${env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/refresh`,
            // Agar backend cookie se refreshToken leta hai to {} bhi chalega,
            // aur agar body mein maangta hai to refreshToken chala jayega
            currentRefreshToken ? { refreshToken: currentRefreshToken } : {},
            { withCredentials: true }
          );

          if (!res.data?.status || !res.data?.data?.accessToken) {
            throw new Error(res.data?.message || "Failed to refresh token");
          }

          const { accessToken, refreshToken } = res.data.data;

          // Zustand store mein naya accessToken aur rotated refreshToken dono update karein
          useAuthStore.setState({
            accessToken,
            ...(refreshToken ? { refreshToken } : {}),
          });

          // Queue mein ruki hui saari requests ko naya token de kar chala dein
          processQueue(null, accessToken);

          // Original failed request ko naye token ke saath dobara chalayein
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          if (typeof window !== "undefined") {
            useAuthStore.setState({
              accessToken: null,
              refreshToken: null,
            });
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};


http.interceptors.request.use(addTokenInterceptor);
httpUpload.interceptors.request.use(addTokenInterceptor);


attachRefreshInterceptor(http);
attachRefreshInterceptor(httpUpload);