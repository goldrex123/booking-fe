"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Vehicle } from "@/types/vehicle";

export function useAvailableVehicles(startAt: string, endAt: string, excludeId?: number) {
  return useQuery<Vehicle[]>({
    queryKey: ["available-vehicles", startAt, endAt, excludeId],
    queryFn: async () => {
      const params = new URLSearchParams({ startAt, endAt });
      if (excludeId) params.set("excludeId", String(excludeId));
      const { data } = await apiClient.get<Vehicle[]>(`/api/vehicles/available?${params}`);
      return data;
    },
    enabled: !!startAt && !!endAt,
  });
}
