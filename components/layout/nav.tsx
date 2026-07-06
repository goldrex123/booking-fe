"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car, Building2, LayoutDashboard, CalendarDays,
  ClipboardList, Users, LogOut, LogIn, Sun, Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { logout } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const userNavItems: NavItem[] = [
  { href: "/", label: "예약 현황", icon: <CalendarDays className="size-4" /> },
  { href: "/reservations/my", label: "내 예약", icon: <ClipboardList className="size-4" /> },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "대시보드", icon: <LayoutDashboard className="size-4" /> },
  { href: "/admin/vehicles", label: "차량 관리", icon: <Car className="size-4" /> },
  { href: "/admin/rooms", label: "부속실 관리", icon: <Building2 className="size-4" /> },
  { href: "/admin/users", label: "사용자 관리", icon: <Users className="size-4" /> },
];

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  // "/"와 "/admin"은 각 메뉴 목록의 인덱스 페이지이면서 동시에 형제 메뉴들의
  // 경로 접두사이기도 하므로(예: "/admin"은 "/admin/vehicles"의 접두사), prefix
  // 매칭 대상에서 제외하고 정확히 일치할 때만 active로 처리한다.
  const isIndexRoute = href === "/" || href === "/admin";
  const isActive = pathname === href || (!isIndexRoute && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
        "hover:bg-primary/8 hover:text-primary",
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
      )}
    >
      <span className={cn(isActive ? "text-primary" : "text-muted-foreground/70")}>
        {icon}
      </span>
      {label}
      {isActive && (
        <span className="ml-auto size-1.5 rounded-full bg-[var(--brand)]" />
      )}
    </Link>
  );
}

export function Nav() {
  const { isLoggedIn, user, isAdmin } = useAuth();
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();

  // 인증 페이지에서는 헤더 숨김
  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-6 px-4 sm:px-6">

        {/* 브랜드 */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary">
            <Car className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">예약관리</span>
        </Link>

        <Separator orientation="vertical" className="h-5" />

        {/* 네비게이션 메뉴 */}
        {isLoggedIn && (
          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
        )}

        {/* 우측 사용자 영역 */}
        <div className="ml-auto flex items-center gap-2">
          {/* 다크모드 토글 */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="테마 전환"
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {isLoggedIn && user ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                  {user.name[0]}
                </div>
                <span className="hidden text-sm font-medium text-foreground sm:block">
                  {user.name}
                </span>
                {isAdmin && (
                  <Badge
                    variant="secondary"
                    className="hidden h-5 px-1.5 text-[10px] font-semibold uppercase tracking-wide sm:flex"
                  >
                    Admin
                  </Badge>
                )}
              </div>
              <Separator orientation="vertical" className="hidden h-4 sm:block" />
              <button
                onClick={logout}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-8 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <LogIn className="size-3.5" />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
