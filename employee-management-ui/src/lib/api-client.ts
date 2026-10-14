// Used by Client Components. Calls go through the Next.js proxy (/api/backend),
// which adds the token from the httpOnly cookie.
export async function apiFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/backend${path}`, { ...init, cache: "no-store" });

  if (response.status === 401) {
    window.location.href = "/login?expired=1";
    throw new Error("Your session has expired. Please log in again.");
  }

  if (response.status === 403) {
    throw new Error("You don't have permission to do this.");
  }

  return response;
}

export async function getErrorMessage(response: Response, fallback: string) {
  const text = await response.text();
  let message = text || fallback;

  try {
    const data = JSON.parse(text);
    if (data.errors) {
      message = Object.values(data.errors).flat().join(" ");
    } else if (data.title) {
      message = data.title;
    }
  } catch {
    // Not JSON, so keep the plain text message
  }

  return message;
}
