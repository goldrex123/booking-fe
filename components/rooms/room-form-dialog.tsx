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
import { useCreateRoom, useUpdateRoom } from "@/hooks/use-rooms";
import type { AncillaryRoom } from "@/types/room";

const schema = z.object({
  name: z.string().min(1, "부속실 이름을 입력해주세요"),
  location: z.string().min(1, "위치를 입력해주세요"),
  capacity: z.coerce.number().int().min(1, "수용 인원을 1 이상 입력해주세요"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: AncillaryRoom;
};

export function RoomFormDialog({ open, onOpenChange, room }: Props) {
  const isEdit = !!room;
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
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
        room
          ? { name: room.name, location: room.location, capacity: room.capacity, description: room.description ?? "" }
          : { name: "", location: "", capacity: 10, description: "" }
      );
    }
  }, [open, room, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: room.id, dto: data });
        toast.success("부속실 정보가 수정되었습니다");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("부속실이 등록되었습니다");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? "부속실 수정에 실패했습니다" : "부속실 등록에 실패했습니다");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "부속실 수정" : "부속실 등록"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">이름</Label>
              <Input id="name" placeholder="회의실 A" aria-invalid={!!errors.name} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacity">수용 인원</Label>
              <Input id="capacity" type="number" min={1} aria-invalid={!!errors.capacity} {...register("capacity")} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">위치</Label>
            <Input id="location" placeholder="3층 302호" aria-invalid={!!errors.location} {...register("location")} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">설명 (선택)</Label>
            <Input id="description" placeholder="빔프로젝터 보유 등" {...register("description")} />
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
