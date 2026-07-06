"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Car, Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toLocalDateTimeString } from "@/lib/date";
import { useAvailableVehicles } from "@/hooks/use-available-vehicles";
import { useCreateReservation } from "@/hooks/use-reservations";

const schema = z
  .object({
    startAt: z.string().min(1, "시작 일시를 입력해주세요"),
    endAt: z.string().min(1, "종료 일시를 입력해주세요"),
    resourceId: z.number({ error: "차량을 선택해주세요" }).min(1, "차량을 선택해주세요"),
    purpose: z.string().min(1, "이용 목적을 입력해주세요"),
    destination: z.string().optional(),
  })
  .refine((d) => !d.startAt || new Date(d.startAt) >= new Date(), {
    message: "시작 일시는 현재 시간 이후여야 합니다",
    path: ["startAt"],
  })
  .refine((d) => !d.startAt || !d.endAt || new Date(d.startAt) < new Date(d.endAt), {
    message: "시작 일시는 종료 일시보다 이전이어야 합니다",
    path: ["startAt"],
  });

type FormData = z.infer<typeof schema>;

export default function VehicleReservationNewPage() {
  const router = useRouter();
  const createReservation = useCreateReservation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { resourceId: undefined },
  });

  const startAt = watch("startAt");
  const endAt = watch("endAt");

  useEffect(() => {
    if (startAt) trigger("startAt");
  }, [startAt]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (endAt) {
      trigger("endAt");
      if (startAt) trigger("startAt");
    }
  }, [endAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // endAt이 startAt보다 빠르면 백엔드가 400을 반환하는데, 어차피 Zod에서도
  // 같은 조건을 검증하므로 이 경우엔 가용 차량 조회 자체를 시도하지 않는다.
  const canShowVehicles = !!startAt && !!endAt && new Date(endAt) > new Date(startAt);
  const startISO = canShowVehicles ? toLocalDateTimeString(new Date(startAt)) : "";
  const endISO = canShowVehicles ? toLocalDateTimeString(new Date(endAt)) : "";

  const { data: availableVehicles, isFetching } = useAvailableVehicles(startISO, endISO);

  const handleSelectVehicle = (vehicleId: number) => {
    if (selectedVehicleId === vehicleId) {
      setSelectedVehicleId(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setValue("resourceId", undefined as any, { shouldValidate: false });
    } else {
      setSelectedVehicleId(vehicleId);
      setValue("resourceId", vehicleId, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createReservation.mutateAsync({
        resourceType: "VEHICLE",
        resourceId: data.resourceId,
        startAt: toLocalDateTimeString(new Date(data.startAt)),
        endAt: toLocalDateTimeString(new Date(data.endAt)),
        purpose: data.purpose,
        destination: data.destination || undefined,
      });
      toast.success("차량 예약이 완료되었습니다");
      router.push("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("이미 예약된 차량입니다. 다른 시간대나 차량을 선택해주세요");
      } else {
        toast.error("예약 중 오류가 발생했습니다");
      }
    }
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Car className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">차량 예약</h1>
          <p className="text-sm text-muted-foreground">업무용 차량을 예약합니다</p>
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

        {/* 차량 선택 */}
        <section className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-foreground">차량 선택</h2>

          {!canShowVehicles ? (
            <p className="text-sm text-muted-foreground">이용 일시를 먼저 입력해주세요</p>
          ) : isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              가용 차량 조회 중...
            </div>
          ) : !availableVehicles?.length ? (
            <p className="text-sm text-muted-foreground">
              해당 시간대에 이용 가능한 차량이 없습니다
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableVehicles.map((vehicle) => {
                const isSelected = selectedVehicleId === vehicle.id;
                return (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => handleSelectVehicle(vehicle.id)}
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
          <Button type="submit" disabled={createReservation.isPending}>
            {createReservation.isPending && <Loader2 className="size-4 animate-spin" />}
            예약 확정
          </Button>
        </div>
      </form>
    </div>
  );
}
