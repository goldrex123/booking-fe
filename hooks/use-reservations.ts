"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { Reservation, CreateReservationDto, UpdateReservationDto } from "@/types/reservation";

const QUERY_KEY = ["reservations"] as const;

type AllReservationsParams = {
  resourceType?: "VEHICLE" | "ROOM";
  startDate?: string;
  endDate?: string;
};

export function useAllReservations(params?: AllReservationsParams) {
  return useQuery<Reservation[]>({
    queryKey: [...QUERY_KEY, params],
    enabled: !!params?.startDate && !!params?.endDate,
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        startDate: params!.startDate!,
        endDate: params!.endDate!,
      });
      if (params?.resourceType) searchParams.set("resourceType", params.resourceType);
      const { data } = await apiClient.get<Reservation[]>(`/api/reservations?${searchParams}`);
      return data;
    },
  });
}

export function useMyReservations() {
  return useQuery<Reservation[]>({
    queryKey: [...QUERY_KEY, "my"],
    queryFn: async () => {
      const { data } = await apiClient.get<Reservation[]>("/api/reservations/my");
      return data;
    },
  });
}

export function useReservation(id: number) {
  return useQuery<Reservation>({
    queryKey: [...QUERY_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<Reservation>(`/api/reservations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateReservationDto) =>
      apiClient.post<Reservation>("/api/reservations", dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateReservationDto }) =>
      apiClient.put<Reservation>(`/api/reservations/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/reservations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
