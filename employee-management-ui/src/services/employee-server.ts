// SERVER ONLY: used by Server Components (pages without "use client")
import { serverFetch } from "@/lib/session";
import { Employee } from "@/types/employee";
import { Department } from "@/types/department";
import { PagedResult } from "@/types/paged-result";

export interface EmployeeQuery {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function getEmployees(): Promise<Employee[]> {
  const response = await serverFetch("/employees");
  if (!response.ok) throw new Error("Failed to fetch employees");
  return response.json();
}

export async function getEmployee(id: number): Promise<Employee | null> {
  const response = await serverFetch(`/employees/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to fetch employee");
  return response.json();
}

export async function getDepartments(): Promise<Department[]> {
  const response = await serverFetch("/departments");
  if (!response.ok) throw new Error("Failed to fetch departments");
  return response.json();
}

export async function getEmployeesPaged(
  query: EmployeeQuery
): Promise<PagedResult<Employee>> {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.status) params.set("status", query.status);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  const response = await serverFetch(`/employees/paged?${params}`);
  if (!response.ok) throw new Error("Failed to fetch employees");
  return response.json();
}
