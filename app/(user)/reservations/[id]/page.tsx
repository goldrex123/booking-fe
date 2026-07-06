"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Car, Building2, Calendar, Clock, MapPin, Target,
  User, Building, ArrowLeft, Pencil,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useReservation, useCancelReservation } from "@/hooks/use-reservations";
import type { Reservation } from "@/types/reservation";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: Reservation["status"] }) {
  if (status === "CONFIRMED") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 px-2.5">
        예약 완료
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground px-2.5">
      취소됨
    </Badge>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { data: reservation, isLoading } = useReservation(id);
  const cancelReservation = useCancelReservation();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const isFuture = reservation ? new Date(reservation.startAt) > new Date() : false;
  const canModify = reservation?.status === "CONFIRMED" && isFuture;

  const handleCancel = async () => {
    try {
      await cancelReservation.mutateAsync(id);
      toast.success("예약이 취소되었습니다");
      router.push("/reservations/my");
    } catch {
      toast.error("예약 취소에 실패했습니다");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6">
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="h-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6 text-center">
        <p className="text-sm text-muted-foreground">예약 정보를 찾을 수 없습니다</p>
        <Link href="/reservations/my" className="mt-3 inline-block text-xs text-primary hover:underline">
          ← 내 예약 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 py-8 sm:px-6">
      {/* 뒤로가기 */}
      <Link
        href="/reservations/my"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        내 예약 목록
      </Link>

      {/* 헤더 카드 */}
      <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              {reservation.resourceType === "VEHICLE" ? (
                <Car className="size-5 text-primary" />
              ) : (
                <Building2 className="size-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">{reservation.resourceName}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {reservation.resourceType === "VEHICLE" ? "차량" : "부속실"} 예약
              </p>
            </div>
          </div>
          <StatusBadge status={reservation.status} />
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="rounded-xl border border-border/60 bg-card px-5 mb-6">
        <InfoRow
          icon={<Calendar className="size-3.5" />}
          label="이용 날짜"
          value={formatDate(reservation.startAt)}
        />
        <InfoRow
          icon={<Clock className="size-3.5" />}
          label="이용 시간"
          value={`${formatTime(reservation.startAt)} ~ ${formatTime(reservation.endAt)}`}
        />
        <InfoRow
          icon={<Target className="size-3.5" />}
          label="이용 목적"
          value={reservation.purpose}
        />
        {reservation.destination && (
          <InfoRow
            icon={<MapPin className="size-3.5" />}
            label="목적지"
            value={reservation.destination}
          />
        )}
        <InfoRow
          icon={<User className="size-3.5" />}
          label="예약자"
          value={`${reservation.userName} (${reservation.userDepartment})`}
        />
        <InfoRow
          icon={<Building className="size-3.5" />}
          label="예약 신청일"
          value={formatDateTime(reservation.createdAt)}
        />
      </div>

      {/* 액션 버튼 */}
      {canModify && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30 hover:border-destructive/50"
            onClick={() => setShowCancelDialog(true)}
          >
            예약 취소
          </Button>
          <Link href={`/reservations/${id}/edit`} className={buttonVariants()}>
            <Pencil className="size-4" />
            예약 수정
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="예약을 취소하시겠습니까?"
        description={
          <>
            <span className="font-medium">{reservation.resourceName}</span> 예약을 취소합니다.
            취소된 예약은 되돌릴 수 없습니다.
          </>
        }
        confirmLabel="예약 취소"
        cancelLabel="돌아가기"
        onConfirm={handleCancel}
        isPending={cancelReservation.isPending}
        destructive
      />
    </div>
  );
}
