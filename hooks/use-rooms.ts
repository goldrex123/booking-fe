"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { AncillaryRoom, CreateRoomDto, UpdateRoomDto } from "@/types/room";

const QUERY_KEY = ["rooms"] as const;

export function useRooms() {
  return useQuery<AncillaryRoom[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<AncillaryRoom[]>("/api/admin/rooms");
      return data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomDto) =>
      apiClient.post<AncillaryRoom>("/api/admin/rooms", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateRoomDto }) =>
      apiClient.put<AncillaryRoom>(`/api/admin/rooms/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleRoomStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "INACTIVE" }) =>
      apiClient.patch<AncillaryRoom>(`/api/admin/rooms/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
