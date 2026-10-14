import { NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/session";

export async function POST() {
  const result = NextResponse.json({ ok: true });
  result.cookies.delete(TOKEN_COOKIE);
  return result;
}
