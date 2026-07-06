"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import apiClient from "@/lib/axios";

const DEPARTMENTS = [
  { value: "YOUTH", label: "청년부" },
  { value: "FATHER", label: "아버지부" },
  { value: "MOTHER", label: "어머니부" },
] as const;

const schema = z
  .object({
    name: z.string().min(2, "이름은 2자 이상 입력해주세요"),
    email: z.string().email("올바른 이메일 형식을 입력해주세요"),
    department: z.enum(["YOUTH", "FATHER", "MOTHER"] as const, "소속 부서를 선택해주세요"),
    password: z.string().min(8, "비밀번호는 8자 이상 입력해주세요"),
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "비밀번호가 일치하지 않습니다",
        path: ["passwordConfirm"],
      });
    }
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await apiClient.post("/api/auth/signup", {
        name: data.name,
        email: data.email,
        department: data.department,
        password: data.password,
      });
      toast.success("회원가입이 완료되었습니다. 로그인해주세요.");
      router.push("/login");
    } catch {
      toast.error("이미 사용 중인 이메일이거나 가입에 실패했습니다");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[1fr_1.1fr]">
      {/* ── 브랜드 패널 ─────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 md:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 size-80 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Car className="size-5 text-white" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">예약관리</span>
        </div>

        <div className="relative space-y-3">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            지금 바로<br />시작해보세요
          </p>
          <p className="text-sm leading-relaxed text-white/60">
            계정 생성 후 즉시 차량과 부속실을<br />예약할 수 있습니다.
          </p>
        </div>

        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: "가입 소요 시간", value: "1분" },
            { label: "즉시 이용 가능", value: "예약 시작" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white/10 p-4">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="mt-0.5 text-xs text-white/60">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 폼 패널 ─────────────────────────────────────── */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary">
              <Car className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-foreground">예약관리</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">회원가입</h1>
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                로그인
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  autoComplete="name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">소속 부서</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="department" aria-invalid={!!errors.department}>
                        <SelectValue placeholder="부서 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.department && (
                  <p className="text-xs text-destructive">{errors.department.message}</p>
                )}
              </div>
            </div>

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
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                placeholder="비밀번호 재입력"
                autoComplete="new-password"
                aria-invalid={!!errors.passwordConfirm}
                {...register("passwordConfirm")}
              />
              {errors.passwordConfirm && (
                <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
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
                  가입하기
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
