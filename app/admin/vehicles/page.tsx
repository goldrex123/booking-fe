"use client";

import { useState } from "react";
import { Car, Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { useVehicles, useToggleVehicleStatus } from "@/hooks/use-vehicles";
import type { Vehicle } from "@/types/vehicle";

export default function VehiclesPage() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const toggleStatus = useToggleVehicleStatus();

  const [formDialog, setFormDialog] = useState<{ open: boolean; vehicle?: Vehicle }>({ open: false });
  const [toggleTarget, setToggleTarget] = useState<Vehicle | null>(null);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    const nextStatus = toggleTarget.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await toggleStatus.mutateAsync({ id: toggleTarget.id, status: nextStatus });
      toast.success(`차량이 ${nextStatus === "ACTIVE" ? "활성화" : "비활성화"}되었습니다`);
    } catch {
      toast.error("상태 변경에 실패했습니다");
    } finally {
      setToggleTarget(null);
    }
  };

  const columns: DataTableColumn<Vehicle>[] = [
    {
      key: "model",
      header: "차종",
      cell: (v) => <span className="font-medium">{v.model}</span>,
    },
    {
      key: "licensePlate",
      header: "번호판",
      cell: (v) => v.licensePlate,
    },
    {
      key: "seats",
      header: "좌석 수",
      headerClassName: "hidden text-center sm:table-cell",
      cellClassName: "hidden text-center sm:table-cell",
      cell: (v) => `${v.seats}인`,
    },
    {
      key: "note",
      header: "메모",
      headerClassName: "hidden md:table-cell",
      cellClassName: "hidden text-muted-foreground md:table-cell",
      cell: (v) => v.note ?? "—",
    },
    {
      key: "status",
      header: "상태",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (v) => (
        <Badge variant={v.status === "ACTIVE" ? "default" : "secondary"}>
          {v.status === "ACTIVE" ? "활성" : "비활성"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "액션",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (v) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFormDialog({ open: true, vehicle: v })}
            title="수정"
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setToggleTarget(v)}
            title={v.status === "ACTIVE" ? "비활성화" : "활성화"}
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
            <Car className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">차량 관리</h1>
            <p className="text-sm text-muted-foreground">등록된 차량을 관리합니다</p>
          </div>
        </div>
        <Button onClick={() => setFormDialog({ open: true })}>
          <Plus className="size-4" />
          차량 등록
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        emptyTitle="등록된 차량이 없습니다"
        emptyIcon={<Car className="size-8" />}
        getRowKey={(v) => v.id}
        getRowClassName={(v) => v.status === "INACTIVE" ? "opacity-50" : ""}
      />

      {/* 차량 등록/수정 다이얼로그 */}
      <VehicleFormDialog
        open={formDialog.open}
        onOpenChange={(open) => setFormDialog({ open, vehicle: open ? formDialog.vehicle : undefined })}
        vehicle={formDialog.vehicle}
      />

      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.status === "ACTIVE" ? "차량 비활성화" : "차량 활성화"}
        description={
          <>
            <span className="font-medium">{toggleTarget?.model} ({toggleTarget?.licensePlate})</span>을(를){" "}
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
