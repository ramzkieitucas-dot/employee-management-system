// SERVER ONLY: used by the Dashboard (Server Component)
import { serverFetch } from "@/lib/session";
import { DashboardSummary } from "@/types/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await serverFetch("/dashboard/summary");
  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
}
