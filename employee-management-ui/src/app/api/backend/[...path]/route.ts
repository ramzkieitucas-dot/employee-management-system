import { NextRequest } from "next/server";
import { API_URL, getToken } from "@/lib/session";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const token = await getToken();

  const headers = new Headers();
  // Keep the original Content-Type (for uploads it includes the multipart boundary)
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const hasBody = ["POST", "PUT", "PATCH"].includes(request.method);

  const response = await fetch(
    `${API_URL}/${path.join("/")}${request.nextUrl.search}`,
    {
      method: request.method,
      headers,
      // arrayBuffer keeps binary data (images) intact
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    }
  );

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseHeaders = new Headers({
    "Content-Type": response.headers.get("content-type") ?? "application/json",
  });

  // Needed for file downloads (Excel / PDF) so the browser gets the file name
  const disposition = response.headers.get("content-disposition");
  if (disposition) responseHeaders.set("Content-Disposition", disposition);

  // arrayBuffer (not text) so binary files aren't corrupted
  return new Response(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
