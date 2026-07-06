"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { AncillaryRoom } from "@/types/room";

export function useAvailableRooms(startAt: string, endAt: string, excludeId?: number) {
  return useQuery<AncillaryRoom[]>({
    queryKey: ["available-rooms", startAt, endAt, excludeId],
    queryFn: async () => {
      const params = new URLSearchParams({ startAt, endAt });
      if (excludeId) params.set("excludeId", String(excludeId));
      const { data } = await apiClient.get<AncillaryRoom[]>(`/api/rooms/available?${params}`);
      return data;
    },
    enabled: !!startAt && !!endAt,
  });
}
