import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiError } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request (client-side only)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("revvfi_jwt");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// Normalize errors; clear auth state on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      // Clear stored token so user is prompted to re-authenticate
      localStorage.removeItem("revvfi_jwt");
      // Dynamic import avoids circular dep at module load time
      import("@/store/auth.store").then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }

    const msg =
      err.response?.data?.error?.message ??
      err.message ??
      "Unknown error";
    const code = err.response?.data?.error?.code ?? "UNKNOWN";
    const enhanced = new Error(msg) as Error & { code: string; status?: number };
    enhanced.code = code;
    enhanced.status = err.response?.status;
    return Promise.reject(enhanced);
  }
);

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<T>(url, config);
  return res.data;
}

export async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.post<T>(url, data, config);
  return res.data;
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.delete<T>(url, config);
  return res.data;
}

export async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await apiClient.patch<T>(url, data, config);
  return res.data;
}
