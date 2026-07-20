import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "accessToken";
const API_TARGET = process.env.NEXT_PUBLIC_API_URL;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── API 프록시 ───────────────────────────────────────────────────────────
  // 프론트엔드(vercel.app)와 백엔드(duckdns.org)가 다른 도메인이면 Refresh
  // Token 쿠키가 브라우저 입장에서 서드파티 쿠키가 되어 iOS Safari 등
  // ITP(서드파티 쿠키 차단) 정책에 걸려 저장/전송되지 않는다. 같은 origin으로
  // 프록시해서 쿠키를 first-party로 만든다.
  if (pathname.startsWith("/api/")) {
    return NextResponse.rewrite(`${API_TARGET}${pathname}${search}`);
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  // ── 관리자 전용 경로 ─────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = decodeJwtPayload(accessToken);
    if (payload?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // ── 일반 보호 경로 ──────────────────────────────────────────────────────────
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!login|signup|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)",
  ],
};
