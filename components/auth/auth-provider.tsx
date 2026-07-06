"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { setAccessTokenCookie, clearAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

// 로그아웃 시 서버가 refreshToken 쿠키를 만료시키므로, 로그아웃 직후
// /login으로 이동한 시점에는 쿠키가 이미 없다. 이 페이지들에서는 세션
// 복원을 시도할 필요가 없고, 시도하면 매번 400(쿠키 없음)이 발생한다.
const SKIP_RESTORE_PATHS = ["/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setInitialized } = useAuthStore();
  const hasFetched = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    // React 18 Strict Mode에서 effect가 두 번 실행되는 것을 방지
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (SKIP_RESTORE_PATHS.includes(pathname)) {
      setInitialized();
      return;
    }

    const restore = async () => {
      try {
        // Refresh Token 쿠키를 이용해 새 Access Token 발급 (앱 초기화 시 한 번 실행)
        const { data } = await axios.post<ApiResponse<AuthResponse>>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAuth(data.data.accessToken, data.data.userInfo);
        setAccessTokenCookie(data.data.accessToken);
      } catch {
        clearAccessTokenCookie();
        clearAuth();
      } finally {
        setInitialized();
      }
    };

    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
