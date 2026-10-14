// CLIENT: used by Client Components ("use client")
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { Role, UserAccount } from "@/types/user";

export interface CreateUserInput {
  username: string;
  email: string | null;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  email: string | null;
  role: Role;
  isActive: boolean;
}

const json = { "Content-Type": "application/json" };

export async function getUsers(): Promise<UserAccount[]> {
  const response = await apiFetch("/users");
  if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to fetch users"));
  return response.json();
}

export async function createUser(input: CreateUserInput): Promise<UserAccount> {
  const response = await apiFetch("/users", {
    method: "POST",
    headers: json,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to create user"));
  return response.json();
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<void> {
  const response = await apiFetch(`/users/${id}`, {
    method: "PUT",
    headers: json,
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to update user"));
}

export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  const response = await apiFetch(`/users/${id}/reset-password`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ newPassword }),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to reset password"));
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await apiFetch("/auth/change-password", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!response.ok) throw new Error(await getErrorMessage(response, "Failed to change password"));
}
