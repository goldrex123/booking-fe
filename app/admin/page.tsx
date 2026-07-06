"use client";

import { useState } from "react";
import {
  LayoutDashboard, Car, Building2, Filter, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { toLocalDateTimeString } from "@/lib/date";
import { useAllReservations, useCancelReservation } from "@/hooks/use-reservations";
import type { Reservation, ResourceType } from "@/types/reservation";
import Link from "next/link";

// GET /api/reservations는 startDate/endDate가 필수 파라미터이므로
// 관리자 대시보드는 넉넉한 기본 범위(작년 1월 1일 ~ 내년 12월 31일)로 전체 예약을 조회한다.
const now = new Date();
const DEFAULT_START = toLocalDateTimeString(new Date(now.getFullYear() - 1, 0, 1));
const DEFAULT_END = toLocalDateTimeString(new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59));

function formatDateRange(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const date = start.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const startT = start.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const endT = end.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return `${date} ${startT}–${endT}`;
}

export default function AdminPage() {
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);

  const params = {
    startDate: DEFAULT_START,
    endDate: DEFAULT_END,
    ...(resourceTypeFilter !== "ALL" ? { resourceType: resourceTypeFilter as ResourceType } : {}),
  };
  const { data: reservations = [], isLoading } = useAllReservations(params);
  const cancelReservation = useCancelReservation();

  const filtered = reservations
    .filter((r) => {
      if (!dateFilter) return true;
      return r.startAt.startsWith(dateFilter) || r.endAt.startsWith(dateFilter);
    })
    .slice()
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelReservation.mutateAsync(cancelTarget.id);
      toast.success("예약이 취소되었습니다");
    } catch {
      toast.error("취소 처리에 실패했습니다");
    } finally {
      setCancelTarget(null);
    }
  };

  const columns: DataTableColumn<Reservation>[] = [
    {
      key: "type",
      header: "구분",
      headerClassName: "w-12 text-center",
      cellClassName: "text-center",
      cell: (r) =>
        r.resourceType === "VEHICLE" ? (
          <Car className="mx-auto size-4 text-blue-500" />
        ) : (
          <Building2 className="mx-auto size-4 text-emerald-500" />
        ),
    },
    {
      key: "resource",
      header: "리소스",
      cell: (r) => <span className="font-medium">{r.resourceName}</span>,
    },
    {
      key: "user",
      header: "예약자",
      cell: (r) => (
        <>
          <span className="text-sm">{r.userName}</span>
          <span className="block text-xs text-muted-foreground">{r.userDepartment}</span>
        </>
      ),
    },
    {
      key: "time",
      header: "일시",
      cellClassName: "text-sm text-muted-foreground whitespace-nowrap",
      cell: (r) => formatDateRange(r.startAt, r.endAt),
    },
    {
      key: "purpose",
      header: "목적",
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell",
      cell: (r) => r.purpose,
    },
    {
      key: "status",
      header: "상태",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "액션",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (r) =>
        r.status === "CONFIRMED" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCancelTarget(r)}
            title="강제 취소"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <LayoutDashboard className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">관리자 대시보드</h1>
            <p className="text-sm text-muted-foreground">전체 예약을 관리합니다</p>
          </div>
        </div>

        {/* 빠른 이동 */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/vehicles"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Car className="size-3.5" />
            차량 관리
          </Link>
          <Link
            href="/admin/rooms"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Building2 className="size-3.5" />
            부속실 관리
          </Link>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="size-3.5" />
          <span>필터</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={resourceTypeFilter}
            onValueChange={(v) => setResourceTypeFilter(v as ResourceType | "ALL")}
          >
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 리소스</SelectItem>
              <SelectItem value="VEHICLE">차량</SelectItem>
              <SelectItem value="ROOM">부속실</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 w-40 text-sm"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter("")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              초기화
            </button>
          )}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {isLoading ? "로딩 중..." : `총 ${filtered.length}건`}
        </span>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="해당 조건의 예약이 없습니다"
        emptyIcon={<LayoutDashboard className="size-8" />}
        getRowKey={(r) => r.id}
        getRowClassName={(r) => r.status === "CANCELLED" ? "opacity-50" : ""}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="예약 강제 취소"
        description={
          <>
            <span className="font-medium">{cancelTarget?.userName}</span>님의{" "}
            <span className="font-medium">{cancelTarget?.resourceName}</span> 예약을
            취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </>
        }
        confirmLabel="취소 확정"
        onConfirm={handleCancel}
        isPending={cancelReservation.isPending}
        destructive
      />
    </div>
  );
}
