import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CurrentUser } from "@/types/user";

export const API_URL = process.env.API_URL ?? "http://localhost:5266/api";
export const TOKEN_COOKIE = "ems_token";

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

// Used by Server Components to call the ASP.NET API with the token
export async function serverFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  return response;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return null;

    return response.json();
  } catch {
    // API is not reachable
    return null;
  }
}
