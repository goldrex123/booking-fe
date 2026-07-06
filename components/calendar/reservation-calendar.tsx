"use client";

import { useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import koLocale from "@fullcalendar/core/locales/ko";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import { Car, Building2, Clock, User, MapPin, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toLocalDateTimeString } from "@/lib/date";
import type { Reservation } from "@/types/reservation";

type Props = {
  reservations: Reservation[];
  onDatesChange?: (startDate: string, endDate: string) => void;
};

type CalendarEventInput = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: { reservation: Reservation };
};

const COLORS = {
  VEHICLE: { bg: "#3b82f6", border: "#2563eb" },
  ROOM:    { bg: "#10b981", border: "#059669" },
  CANCELLED: { bg: "#94a3b8", border: "#64748b" },
};

const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReservationCalendar({ reservations, onDatesChange }: Props) {
  const [selected, setSelected] = useState<Reservation | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // 연도 범위: 현재 ±5년
  const yearOptions = Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i);

  const events: CalendarEventInput[] = reservations.map((r) => {
    const c = r.status === "CANCELLED" ? COLORS.CANCELLED : COLORS[r.resourceType];
    return {
      id: String(r.id),
      title: r.resourceName,
      start: r.startAt,
      end: r.endAt,
      backgroundColor: c.bg,
      borderColor: c.border,
      textColor: "#fff",
      extendedProps: { reservation: r },
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    setSelected((info.event.extendedProps as { reservation: Reservation }).reservation);
  };

  const handleDatesSet = (info: DatesSetArg) => {
    // 현재 표시 중인 날짜 중간값으로 연/월 동기화
    const mid = new Date(info.start);
    mid.setDate(mid.getDate() + 15);
    setViewYear(mid.getFullYear());
    setViewMonth(mid.getMonth());

    onDatesChange?.(
      toLocalDateTimeString(info.start),
      toLocalDateTimeString(info.end)
    );
  };

  const handleYearChange = (year: number) => {
    setViewYear(year);
    calendarRef.current?.getApi().gotoDate(new Date(year, viewMonth, 1));
  };

  const handleMonthChange = (month: number) => {
    setViewMonth(month);
    calendarRef.current?.getApi().gotoDate(new Date(viewYear, month, 1));
  };

  return (
    <>
      <div className="rounded-xl border border-border/60 bg-card p-4">
        {/* 연/월 빠른 이동 */}
        <div className="mb-3 flex items-center gap-2">
          <select
            value={viewYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select
            value={viewMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="h-8 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            {MONTHS.map((label, i) => (
              <option key={i} value={i}>{label}</option>
            ))}
          </select>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={koLocale}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          nowIndicator
          fixedWeekCount={false}
        />
      </div>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-4 px-1">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-blue-500" />
          <span className="text-xs text-muted-foreground">차량</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-emerald-500" />
          <span className="text-xs text-muted-foreground">부속실</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-slate-400" />
          <span className="text-xs text-muted-foreground">취소됨</span>
        </div>
      </div>

      {/* 예약 상세 팝오버 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-border/60 bg-card p-5 shadow-xl">
            {/* 헤더 */}
            <div className="mb-4 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    selected.resourceType === "VEHICLE"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600"
                  )}
                >
                  {selected.resourceType === "VEHICLE" ? (
                    <Car className="size-4" />
                  ) : (
                    <Building2 className="size-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold leading-snug">{selected.resourceName}</p>
                  <span
                    className={cn(
                      "inline-block mt-0.5 rounded-full px-2 py-px text-[10px] font-medium",
                      selected.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {selected.status === "CONFIRMED" ? "예약 완료" : "취소됨"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="mt-0.5 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 상세 정보 */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <Clock className="mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p>{formatDateTime(selected.startAt)}</p>
                  <p className="text-xs">
                    ~ {formatTime(selected.endAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <User className="size-3.5 shrink-0" />
                <span>
                  {selected.userName}
                  <span className="ml-1 text-xs text-muted-foreground/70">
                    ({selected.userDepartment})
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <FileText className="mt-0.5 size-3.5 shrink-0" />
                <span>{selected.purpose}</span>
              </div>
              {selected.destination && (
                <div className="flex items-start gap-2.5 text-muted-foreground">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>{selected.destination}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
