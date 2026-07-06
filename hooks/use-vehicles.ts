"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from "@/types/vehicle";

const QUERY_KEY = ["vehicles"] as const;

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<Vehicle[]>("/api/admin/vehicles");
      return data;
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateVehicleDto) =>
      apiClient.post<Vehicle>("/api/admin/vehicles", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateVehicleDto }) =>
      apiClient.put<Vehicle>(`/api/admin/vehicles/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleVehicleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "ACTIVE" | "INACTIVE" }) =>
      apiClient.patch<Vehicle>(`/api/admin/vehicles/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
