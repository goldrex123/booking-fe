"use client";

import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const { accessToken, user, isInitialized } = useAuthStore();

  return {
    isLoggedIn: !!accessToken && !!user,
    isInitialized,
    user,
    isAdmin: user?.role === "ADMIN",
  };
}
