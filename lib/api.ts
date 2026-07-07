import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";
import type { ApiError } from "@/types";
import { logger } from "./logger";

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT and Correlation ID on every request (client-side only)
apiClient.interceptors.request.use((config) => {
  // Generate correlation ID for request tracing
  const correlationId = uuidv4();
  config.headers["X-Correlation-ID"] = correlationId;
  (config as any).correlationId = correlationId;

  // Attach JWT token if available
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("revvfi_jwt");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  logger.debug("API request starting", {
    correlation_id: correlationId,
    method: config.method,
    url: config.url,
  });

  return config;
});

// Normalize errors; clear auth state on 401
apiClient.interceptors.response.use(
  (res) => {
    // Log successful response
    const correlationId = (res.config as any).correlationId;
    logger.debug("API request completed", {
      correlation_id: correlationId,
      status_code: res.status,
      method: res.config.method,
      url: res.config.url,
    });
    return res;
  },
  (err: AxiosError<ApiError>) => {
    const correlationId = (err.config as any)?.correlationId;
    const logData = {
      correlation_id: correlationId,
      status_code: err.response?.status,
      method: err.config?.method,
      url: err.config?.url,
      error_message: err.response?.data?.error?.message || err.message,
    };

    // A 404 on a "get a single resource" request (e.g. "is this address a
    // borrower?") is frequently a normal, expected outcome - not a genuine
    // failure - so it's logged at debug level rather than error. Every
    // other status (5xx, network errors, etc.) still logs as an error.
    if (err.response?.status === 404) {
      logger.debug("API request returned 404 (resource not found)", logData);
    } else {
      logger.error("API request failed", err, logData);
    }

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
