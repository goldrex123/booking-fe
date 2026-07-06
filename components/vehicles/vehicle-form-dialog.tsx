"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateVehicle, useUpdateVehicle } from "@/hooks/use-vehicles";
import type { Vehicle } from "@/types/vehicle";

const schema = z.object({
  model: z.string().min(1, "차종을 입력해주세요"),
  licensePlate: z.string().min(1, "번호판을 입력해주세요"),
  seats: z.coerce.number().int().min(1, "좌석 수를 1 이상 입력해주세요"),
  note: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
};

export function VehicleFormDialog({ open, onOpenChange, vehicle }: Props) {
  const isEdit = !!vehicle;
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as Resolver<FormData> });

  useEffect(() => {
    if (open) {
      reset(
        vehicle
          ? { model: vehicle.model, licensePlate: vehicle.licensePlate, seats: vehicle.seats, note: vehicle.note ?? "" }
          : { model: "", licensePlate: "", seats: 5, note: "" }
      );
    }
  }, [open, vehicle, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        const { model, seats, note } = data;
        await updateMutation.mutateAsync({ id: vehicle.id, dto: { model, seats, note } });
        toast.success("차량 정보가 수정되었습니다");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("차량이 등록되었습니다");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "차량 수정에 실패했습니다" : "차량 등록에 실패했습니다");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "차량 수정" : "차량 등록"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="model">차종</Label>
              <Input id="model" placeholder="소나타" aria-invalid={!!errors.model} {...register("model")} />
              {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seats">좌석 수</Label>
              <Input id="seats" type="number" min={1} aria-invalid={!!errors.seats} {...register("seats")} />
              {errors.seats && <p className="text-xs text-destructive">{errors.seats.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="licensePlate">번호판</Label>
            <Input
              id="licensePlate"
              placeholder="12가 3456"
              aria-invalid={!!errors.licensePlate}
              disabled={isEdit}
              {...register("licensePlate")}
            />
            {errors.licensePlate && <p className="text-xs text-destructive">{errors.licensePlate.message}</p>}
            {isEdit && <p className="text-xs text-muted-foreground">번호판은 등록 후 변경할 수 없습니다</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">메모 (선택)</Label>
            <Input id="note" placeholder="특이사항 입력" {...register("note")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
