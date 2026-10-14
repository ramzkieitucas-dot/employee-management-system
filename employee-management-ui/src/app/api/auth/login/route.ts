import { NextRequest, NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/session";

export async function POST(request: NextRequest) {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { title: "Unable to reach the API. Is it running?" },
      { status: 503 }
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { title: data.title ?? "Invalid username or password." },
      { status: response.status }
    );
  }

  const result = NextResponse.json({ username: data.username, role: data.role });

  result.cookies.set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(data.expiresAt),
  });

  return result;
}
