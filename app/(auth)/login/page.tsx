"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/lib/axios";
import { setAccessTokenCookie } from "@/lib/cookies";
import type { AuthResponse } from "@/types/auth";

const schema = z.object({
  email: z.string().email("올바른 이메일 형식을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await apiClient.post<AuthResponse>("/api/auth/login", data);
      setAuth(res.data.accessToken, res.data.userInfo);
      setAccessTokenCookie(res.data.accessToken);
      router.replace(res.data.userInfo.role === "ADMIN" ? "/admin" : "/");
    } catch {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1fr_1.1fr]">
      {/* ── 브랜드 패널 ─────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 md:flex">
        {/* 도트 그리드 패턴 */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* 장식용 원형 */}
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />

        {/* 브랜드 */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Car className="size-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">예약관리</span>
        </div>

        {/* 중앙 문구 */}
        <div className="relative space-y-3">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            차량과 공간을<br />스마트하게 예약하세요
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            중복 없는 예약, 실시간 현황 파악.<br />
            우리 조직의 리소스를 효율적으로 관리합니다.
          </p>
        </div>

        {/* 하단 장식 */}
        <div className="relative" />
      </div>

      {/* ── 폼 패널 ─────────────────────────────────────── */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* 모바일 브랜드 */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary">
              <Car className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-foreground">예약관리</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">로그인</h1>
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                회원가입
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  로그인
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
