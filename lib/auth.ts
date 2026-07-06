import apiClient from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { clearAccessTokenCookie } from "@/lib/cookies";

export { setAccessTokenCookie, clearAccessTokenCookie } from "@/lib/cookies";

export async function logout() {
  try {
    await apiClient.post("/api/auth/logout");
  } finally {
    useAuthStore.getState().clearAuth();
    clearAccessTokenCookie();
    window.location.href = "/login";
  }
}
