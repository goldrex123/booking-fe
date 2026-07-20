// NOTE: 이 파일은 클라이언트 사이드 전용입니다.
// Zustand store를 직접 참조하므로 서버 컴포넌트에서 import 하지 마세요.
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { setAccessTokenCookie, clearAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

// baseURL을 지정하지 않아 항상 현재 origin(same-origin)으로 요청한다.
// proxy.ts가 /api/* 요청을 백엔드로 프록시하므로, 백엔드 도메인을 직접
// 알 필요가 없고 Refresh Token 쿠키도 first-party로 유지된다.
const apiClient = axios.create({
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

// ─── Silent Refresh ──────────────────────────────────────────────────────────
// 401 응답 시 Refresh Token(httpOnly 쿠키)으로 Access Token 재발급 후 원래 요청 재시도.
// 백엔드가 Refresh Token을 1회용으로 로테이션하므로, 호출자가 여러 명이어도
// 실제 네트워크 요청은 항상 하나만 나가야 한다(동시 refresh 시 토큰 경합으로
// 뒤늦게 도착한 쪽이 "무효한 Refresh Token"으로 거부됨). 이 함수가 유일한
// refresh 경로이며, AuthProvider의 세션 복원도 반드시 이 함수를 통해야 한다.
let refreshPromise: Promise<string> | null = null;

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AuthResponse>>("/api/auth/refresh", {}, { withCredentials: true })
      .then(({ data }) => {
        const { accessToken, userInfo } = data.data;
        useAuthStore.getState().setAuth(accessToken, userInfo);
        setAccessTokenCookie(accessToken);
        return accessToken;
      })
      .catch((err) => {
        useAuthStore.getState().clearAuth();
        clearAccessTokenCookie();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

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

    // 401이 아니거나, 이미 재시도했거나, 리프레시/로그인 엔드포인트 자체가 실패한 경우 그대로 reject
    // (로그인 401은 비밀번호 오류 등 자격 증명 실패이지 세션 만료가 아니므로 갱신 대상이 아님)
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/api/auth/refresh") ||
      originalRequest?.url?.includes("/api/auth/login")
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

    originalRequest!._retry = true;

    try {
      // 진행 중인 refresh가 있으면 그 Promise를 공유해서 대기(중복 refresh 방지)
      const accessToken = await refreshAccessToken();
      originalRequest!.headers["Authorization"] = `Bearer ${accessToken}`;
      return apiClient(originalRequest!);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        // Refresh Token이 만료되었거나(자연 만료), 다른 기기의 로그인으로
        // 서버에서 무효화된 경우 모두 이 경로를 탄다. 원인을 특정할 수
        // 없으므로 두 경우를 포괄하는 안내만 표시한다.
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요");
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    }
  }
);

export default apiClient;
