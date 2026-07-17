"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { refreshAccessToken } from "@/lib/axios";

// 로그아웃 시 서버가 refreshToken 쿠키를 만료시키므로, 로그아웃 직후
// /login으로 이동한 시점에는 쿠키가 이미 없다. 이 페이지들에서는 세션
// 복원을 시도할 필요가 없고, 시도하면 매번 400(쿠키 없음)이 발생한다.
const SKIP_RESTORE_PATHS = ["/login", "/signup"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setInitialized } = useAuthStore();
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

    // Refresh Token 쿠키를 이용해 새 Access Token 발급 (앱 초기화 시 한 번 실행).
    // apiClient의 401 silent-refresh와 동일한 refreshAccessToken()을 공유해야
    // 동시 refresh로 인한 Refresh Token 로테이션 경합을 피할 수 있다.
    refreshAccessToken()
      .catch(() => {})
      .finally(() => setInitialized());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
