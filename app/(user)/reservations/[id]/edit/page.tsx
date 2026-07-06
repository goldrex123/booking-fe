"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Car, Building2, Loader2, CheckCircle2, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toLocalDateTimeString } from "@/lib/date";
import { useReservation, useUpdateReservation } from "@/hooks/use-reservations";
import { useAvailableVehicles } from "@/hooks/use-available-vehicles";
import { useAvailableRooms } from "@/hooks/use-available-rooms";

const schema = z
  .object({
    startAt: z.string().min(1, "시작 일시를 입력해주세요"),
    endAt: z.string().min(1, "종료 일시를 입력해주세요"),
    resourceId: z.coerce.number().min(1, "예약 대상을 선택해주세요"),
    purpose: z.string().min(1, "이용 목적을 입력해주세요"),
    destination: z.string().optional(),
  })
  .refine((d) => !d.startAt || !d.endAt || new Date(d.endAt) > new Date(d.startAt), {
    message: "종료 일시는 시작 일시 이후여야 합니다",
    path: ["endAt"],
  });

type FormData = z.infer<typeof schema>;

// ISO → datetime-local 형식 변환 (YYYY-MM-DDTHH:mm)
const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function ReservationEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: reservation, isLoading } = useReservation(id);
  const updateReservation = useUpdateReservation();
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { resourceId: undefined },
  });

  // 예약 데이터 로드 후 폼 초기화
  useEffect(() => {
    if (reservation && !initialized) {
      reset({
        startAt: toDatetimeLocal(reservation.startAt),
        endAt: toDatetimeLocal(reservation.endAt),
        resourceId: reservation.resourceId,
        purpose: reservation.purpose,
        destination: reservation.destination ?? "",
      });
      setSelectedResourceId(reservation.resourceId);
      setInitialized(true);
    }
  }, [reservation, initialized, reset]);

  const startAt = watch("startAt");
  const endAt = watch("endAt");

  // endAt이 startAt보다 빠르면 백엔드가 400을 반환하는데, 어차피 Zod에서도
  // 같은 조건을 검증하므로 이 경우엔 가용 리소스 조회 자체를 시도하지 않는다.
  const canShowResources = !!startAt && !!endAt && new Date(endAt) > new Date(startAt);
  const startISO = canShowResources ? toLocalDateTimeString(new Date(startAt)) : "";
  const endISO = canShowResources ? toLocalDateTimeString(new Date(endAt)) : "";

  const isVehicle = reservation?.resourceType === "VEHICLE";

  const { data: availableVehicles, isFetching: fetchingVehicles } = useAvailableVehicles(
    startISO,
    endISO,
    isVehicle ? id : undefined
  );
  const { data: availableRooms, isFetching: fetchingRooms } = useAvailableRooms(
    startISO,
    endISO,
    !isVehicle ? id : undefined
  );

  const isFetching = isVehicle ? fetchingVehicles : fetchingRooms;
  const availableResources = isVehicle ? availableVehicles : availableRooms;

  const handleSelectResource = (resourceId: number) => {
    setSelectedResourceId(resourceId);
    setValue("resourceId", resourceId, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    try {
      await updateReservation.mutateAsync({
        id,
        dto: {
          startAt: toLocalDateTimeString(new Date(data.startAt)),
          endAt: toLocalDateTimeString(new Date(data.endAt)),
          purpose: data.purpose,
          destination: data.destination || undefined,
        },
      });
      toast.success("예약이 수정되었습니다");
      router.push(`/reservations/${id}`);
    } catch {
      toast.error("예약 수정에 실패했습니다");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6 space-y-4">
        <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-60 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6 text-center">
        <p className="text-sm text-muted-foreground">예약 정보를 찾을 수 없습니다</p>
      </div>
    );
  }

  const Icon = isVehicle ? Car : Building2;

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6">
      {/* 뒤로가기 */}
      <Link
        href={`/reservations/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        예약 상세로
      </Link>

      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">예약 수정</h1>
          <p className="text-sm text-muted-foreground">{reservation.resourceName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* 날짜/시간 선택 */}
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">이용 일시</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startAt">시작 일시</Label>
              <Input
                id="startAt"
                type="datetime-local"
                aria-invalid={!!errors.startAt}
                {...register("startAt")}
              />
              {errors.startAt && (
                <p className="text-xs text-destructive">{errors.startAt.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">종료 일시</Label>
              <Input
                id="endAt"
                type="datetime-local"
                aria-invalid={!!errors.endAt}
                {...register("endAt")}
              />
              {errors.endAt && (
                <p className="text-xs text-destructive">{errors.endAt.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* 리소스 선택 */}
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            {isVehicle ? "차량 선택" : "부속실 선택"}
          </h2>

          {!canShowResources ? (
            <p className="text-sm text-muted-foreground">이용 일시를 먼저 입력해주세요</p>
          ) : isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              가용 {isVehicle ? "차량" : "부속실"} 조회 중...
            </div>
          ) : !availableResources?.length ? (
            <p className="text-sm text-muted-foreground">
              해당 시간대에 이용 가능한 {isVehicle ? "차량" : "부속실"}이 없습니다
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {isVehicle
                ? availableVehicles?.map((vehicle) => {
                    const isSelected = selectedResourceId === vehicle.id;
                    return (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelectResource(vehicle.id)}
                        className={cn(
                          "relative flex flex-col gap-1.5 rounded-lg border p-4 text-left transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border/60 bg-background"
                        )}
                      >
                        {isSelected && (
                          <CheckCircle2 className="absolute right-3 top-3 size-4 text-primary" />
                        )}
                        <span className="font-medium text-sm text-foreground">{vehicle.model}</span>
                        <span className="text-xs text-muted-foreground">{vehicle.licensePlate}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            {vehicle.seats}인승
                          </Badge>
                        </div>
                        {vehicle.note && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{vehicle.note}</p>
                        )}
                      </button>
                    );
                  })
                : availableRooms?.map((room) => {
                    const isSelected = selectedResourceId === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleSelectResource(room.id)}
                        className={cn(
                          "relative flex flex-col gap-1.5 rounded-lg border p-4 text-left transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border/60 bg-background"
                        )}
                      >
                        {isSelected && (
                          <CheckCircle2 className="absolute right-3 top-3 size-4 text-primary" />
                        )}
                        <span className="font-medium text-sm text-foreground">{room.name}</span>
                        <span className="text-xs text-muted-foreground">{room.location}</span>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            <Users className="size-2.5 mr-1" />
                            {room.capacity}명
                          </Badge>
                        </div>
                        {room.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">{room.description}</p>
                        )}
                      </button>
                    );
                  })}
            </div>
          )}
          {errors.resourceId && (
            <p className="mt-2 text-xs text-destructive">{errors.resourceId.message}</p>
          )}
        </section>

        {/* 상세 정보 */}
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">이용 정보</h2>
          <div className="space-y-4">
            {isVehicle && (
              <div className="space-y-1.5">
                <Label htmlFor="destination">
                  <MapPin className="inline size-3.5 mr-1 -mt-0.5" />
                  목적지
                </Label>
                <Input
                  id="destination"
                  placeholder="예: 강남구 테헤란로 123"
                  {...register("destination")}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="purpose">
                이용 목적 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="purpose"
                placeholder="예: 고객사 미팅"
                aria-invalid={!!errors.purpose}
                {...register("purpose")}
              />
              {errors.purpose && (
                <p className="text-xs text-destructive">{errors.purpose.message}</p>
              )}
            </div>
          </div>
        </section>

        {/* 액션 */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={updateReservation.isPending}>
            {updateReservation.isPending && <Loader2 className="size-4 animate-spin" />}
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
