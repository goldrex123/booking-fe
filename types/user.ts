export type UserRole = "ADMIN" | "USER";

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  department: string;
  role: UserRole;
};
