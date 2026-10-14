// CLIENT: used by Client Components ("use client")
import { Department } from "@/types/department";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

export async function getDepartmentList(): Promise<Department[]> {
  const response = await apiFetch("/departments");
  if (!response.ok) throw new Error("Failed to fetch departments");
  return response.json();
}

export async function createDepartment(departmentName: string): Promise<Department> {
  const response = await apiFetch("/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ departmentName }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create department"));
  }

  return response.json();
}

export async function updateDepartment(id: number, departmentName: string): Promise<void> {
  const response = await apiFetch(`/departments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ departmentName }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to update department"));
  }
}

export async function deleteDepartment(id: number): Promise<void> {
  const response = await apiFetch(`/departments/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to delete department"));
  }
}
