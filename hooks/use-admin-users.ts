"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { AdminUser, UserRole } from "@/types/user";

const QUERY_KEY = ["admin", "users"] as const;

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
};

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiClient.get<PageResponse<AdminUser>>("/api/admin/users", {
        params: { size: 100 },
      });
      return data.content;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      apiClient.patch<AdminUser>(`/api/admin/users/${id}/role`, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
