export type Role = "Admin" | "HR" | "Employee";

export const ROLES: Role[] = ["Admin", "HR", "Employee"];

export interface CurrentUser {
  userId: string;
  username: string;
  role: Role;
  email?: string | null;
}

export interface UserAccount {
  userId: number;
  username: string;
  email?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}
