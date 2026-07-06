"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Car, Building2, Plus, CalendarDays } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAllReservations } from "@/hooks/use-reservations";
import type { ResourceType } from "@/types/reservation";

const ReservationCalendar = dynamic(
  () =>
    import("@/components/calendar/reservation-calendar").then((m) => ({
      default: m.ReservationCalendar,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[640px] animate-pulse rounded-xl border border-border/60 bg-muted" />
    ),
  }
);

export default function HomePage() {
  const [resourceType, setResourceType] = useState<ResourceType>("VEHICLE");
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { data: reservations = [] } = useAllReservations({
    resourceType,
    ...dateRange,
  });

  const newHref =
    resourceType === "VEHICLE"
      ? "/reservations/vehicle/new"
      : "/reservations/room/new";
  const newLabel =
    resourceType === "VEHICLE" ? "차량 예약하기" : "부속실 예약하기";

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6">
      {/* 헤더 */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">예약 현황</h1>
            <p className="text-sm text-muted-foreground">전체 예약 일정을 확인합니다</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            value={resourceType}
            onValueChange={(v) => setResourceType(v as ResourceType)}
          >
            <TabsList>
              <TabsTrigger value="VEHICLE" className="gap-1.5">
                <Car className="size-3.5" />
                <span className="hidden sm:inline">차량</span>
              </TabsTrigger>
              <TabsTrigger value="ROOM" className="gap-1.5">
                <Building2 className="size-3.5" />
                <span className="hidden sm:inline">부속실</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Link href={newHref} className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="size-3.5" />
            {newLabel}
          </Link>
        </div>
      </div>

      {/* 캘린더 */}
      <ReservationCalendar
        reservations={reservations}
        onDatesChange={(startDate, endDate) =>
          setDateRange({ startDate, endDate })
        }
      />
    </div>
  );
}
