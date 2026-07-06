export type Role = "ADMIN" | "USER";

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  userInfo: User;
}
