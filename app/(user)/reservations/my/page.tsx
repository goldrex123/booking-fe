"use client";

import Link from "next/link";
import { ClipboardList, Car, Building2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyReservations } from "@/hooks/use-reservations";
import type { Reservation } from "@/types/reservation";

function formatDateRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dateOpts = { year: "numeric", month: "long", day: "numeric", weekday: "short" } as const;
  const startDateStr = start.toLocaleDateString("ko-KR", dateOpts);
  const startTime = start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  const isSameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (isSameDay) {
    return `${startDateStr} ${startTime} ~ ${endTime}`;
  }

  const endDateStr = end.toLocaleDateString("ko-KR", dateOpts);
  return `${startDateStr} ${startTime} ~ ${endDateStr} ${endTime}`;
}

function StatusBadge({ status }: { status: Reservation["status"] }) {
  if (status === "CONFIRMED") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        예약 완료
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      취소됨
    </Badge>
  );
}

function ReservationRow({ reservation }: { reservation: Reservation }) {
  return (
    <Link
      href={`/reservations/${reservation.id}`}
      className="flex items-start gap-4 rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.02]"
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {reservation.resourceType === "VEHICLE" ? (
          <Car className="size-4 text-muted-foreground" />
        ) : (
          <Building2 className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{reservation.resourceName}</p>
          <StatusBadge status={reservation.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{formatDateRange(reservation.startAt, reservation.endAt)}</p>
        <p className="mt-1 text-xs text-muted-foreground truncate">{reservation.purpose}</p>
        {reservation.destination && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">→ {reservation.destination}</p>
        )}
      </div>
      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="size-8 rounded-md bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/5 rounded bg-muted animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export default function MyReservationsPage() {
  const { data: reservations, isLoading } = useMyReservations();

  const vehicleReservations = reservations?.filter((r) => r.resourceType === "VEHICLE") ?? [];
  const roomReservations = reservations?.filter((r) => r.resourceType === "ROOM") ?? [];

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <ClipboardList className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">내 예약</h1>
          <p className="text-sm text-muted-foreground">내가 신청한 예약 목록입니다</p>
        </div>
      </div>

      <Tabs defaultValue="vehicle">
        <TabsList className="mb-6">
          <TabsTrigger value="vehicle" className="gap-1.5">
            <Car className="size-3.5" />
            차량 예약
            {!isLoading && vehicleReservations.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-medium text-primary">
                {vehicleReservations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="room" className="gap-1.5">
            <Building2 className="size-3.5" />
            부속실 예약
            {!isLoading && roomReservations.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 py-0 text-[10px] font-medium text-primary">
                {roomReservations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle" className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : vehicleReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <Car className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">차량 예약 내역이 없습니다</p>
              <Link
                href="/reservations/vehicle/new"
                className="mt-3 text-xs text-primary hover:underline"
              >
                차량 예약하기 →
              </Link>
            </div>
          ) : (
            vehicleReservations.map((r) => <ReservationRow key={r.id} reservation={r} />)
          )}
        </TabsContent>

        <TabsContent value="room" className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          ) : roomReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <Building2 className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">부속실 예약 내역이 없습니다</p>
              <Link
                href="/reservations/room/new"
                className="mt-3 text-xs text-primary hover:underline"
              >
                부속실 예약하기 →
              </Link>
            </div>
          ) : (
            roomReservations.map((r) => <ReservationRow key={r.id} reservation={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
