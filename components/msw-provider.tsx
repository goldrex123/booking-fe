"use client";

import { useEffect, useState } from "react";

// MSW는 개발 환경에서만 활성화됩니다.
// NEXT_PUBLIC_MSW_ENABLED=true 인 경우에만 서비스 워커를 시작합니다.
const MSW_ENABLED = process.env.NEXT_PUBLIC_MSW_ENABLED === "true";

async function startWorker() {
  const { worker } = await import("@/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass", // 핸들러 없는 요청은 그냥 통과
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}

export function MswProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(!MSW_ENABLED);

  useEffect(() => {
    if (!MSW_ENABLED) return;

    startWorker().then(() => {
      console.log("[MSW] 목 서버 활성화됨");
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">MSW 초기화 중...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
