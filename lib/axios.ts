// NOTE: 이 파일은 클라이언트 사이드 전용입니다.
// Zustand store를 직접 참조하므로 서버 컴포넌트에서 import 하지 마세요.
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { setAccessTokenCookie, clearAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// 메모리에 저장된 Access Token을 모든 요청 헤더에 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor (Silent Refresh) ──────────────────────────────────
// 401 응답 시 Refresh Token(httpOnly 쿠키)으로 Access Token 재발급 후 원래 요청 재시도.
// 동시 다발 401: 갱신 완료까지 큐에 적재 후 일괄 재시도.

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let pendingQueue: QueueItem[] = [];

const drainQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  pendingQueue = [];
};

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "success" in body && "data" in body) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    // 401이 아니거나, 이미 재시도했거나, 리프레시 엔드포인트 자체가 실패한 경우 그대로 reject
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/api/auth/refresh")
    ) {
      // 401·취소 요청 외 에러는 Sonner Toast로 자동 표시
      const status = error.response?.status;
      const isCanceled = axios.isCancel(error);
      const isAuthEndpoint = originalRequest?.url?.includes("/api/auth/");
      if (!isCanceled && status !== 401 && !isAuthEndpoint) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ??
          "요청 처리 중 오류가 발생했습니다";
        toast.error(message);
      }
      return Promise.reject(error);
    }

    // 이미 갱신 중이면 완료까지 큐에서 대기
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest!.headers["Authorization"] = `Bearer ${token}`;
          return apiClient(originalRequest!);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest!._retry = true;
    isRefreshing = true;

    try {
      // Refresh Token은 httpOnly 쿠키로 자동 전송됨 (withCredentials: true)
      const { data } = await axios.post<ApiResponse<AuthResponse>>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken, userInfo } = data.data;
      useAuthStore.getState().setAuth(accessToken, userInfo);
      setAccessTokenCookie(accessToken);
      drainQueue(null, accessToken);

      originalRequest!.headers["Authorization"] = `Bearer ${accessToken}`;
      return apiClient(originalRequest!);
    } catch (refreshError) {
      drainQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      clearAccessTokenCookie();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
