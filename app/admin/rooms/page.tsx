"use client";

import { useState } from "react";
import { Building2, Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RoomFormDialog } from "@/components/rooms/room-form-dialog";
import { useRooms, useToggleRoomStatus } from "@/hooks/use-rooms";
import type { AncillaryRoom } from "@/types/room";

export default function RoomsPage() {
  const { data: rooms = [], isLoading } = useRooms();
  const toggleStatus = useToggleRoomStatus();

  const [formDialog, setFormDialog] = useState<{ open: boolean; room?: AncillaryRoom }>({ open: false });
  const [toggleTarget, setToggleTarget] = useState<AncillaryRoom | null>(null);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    const nextStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await toggleStatus.mutateAsync({ id: toggleTarget.id, status: nextStatus });
      toast.success(`부속실이 ${nextStatus === "ACTIVE" ? "활성화" : "비활성화"}되었습니다`);
    } catch {
      toast.error("상태 변경에 실패했습니다");
    } finally {
      setToggleTarget(null);
    }
  };

  const columns: DataTableColumn<AncillaryRoom>[] = [
    {
      key: "name",
      header: "이름",
      cell: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: "location",
      header: "위치",
      cell: (r) => r.location,
    },
    {
      key: "capacity",
      header: "수용 인원",
      headerClassName: "hidden text-center sm:table-cell",
      cellClassName: "hidden text-center sm:table-cell",
      cell: (r) => `${r.capacity}명`,
    },
    {
      key: "description",
      header: "설명",
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden text-muted-foreground md:table-cell",
      cell: (r) => r.description ?? "—",
    },
    {
      key: "status",
      header: "상태",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (r) => (
        <Badge variant={r.status === "ACTIVE" ? "default" : "secondary"}>
          {r.status === "ACTIVE" ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "액션",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFormDialog({ open: true, room: r })}
            title="수정"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setToggleTarget(r)}
            title={r.status === "ACTIVE" ? "비활성화" : "활성화"}
          >
            <Power className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">부속실 관리</h1>
            <p className="text-sm text-muted-foreground">등록된 부속실을 관리합니다</p>
          </div>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="size-4" />
          부속실 등록
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        isLoading={isLoading}
        emptyTitle="등록된 부속실이 없습니다"
        emptyIcon={<Building2 className="size-8" />}
        getRowKey={(r) => r.id}
        getRowClassName={(r) => r.status === "INACTIVE" ? "opacity-50" : ""}
      />

      {/* 부속실 등록/수정 다이얼로그 */}
      <RoomFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, room: open ? formDialog.room : undefined })}
        room={formDialog.room}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "부속실 비활성화" : "부속실 활성화"}
        description={
          <>
            <span className="font-medium">{toggleTarget?.name}</span>을(를){" "}
            {toggleTarget?.status === "ACTIVE"
              ? "비활성화하면 예약이 불가능합니다."
              : "활성화하면 예약이 가능해집니다."}{" "}
            계속하시겠습니까?
          </>
        }
        onConfirm={handleToggle}
        isPending={toggleStatus.isPending}
      />
    </div>
  );
}
