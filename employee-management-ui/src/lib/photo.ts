// Turns "/uploads/employees/abc.jpg" into a full URL served by the ASP.NET API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5266";

export const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function getPhotoUrl(path?: string | null) {
  if (!path) return null;
  return `${API_BASE}${path}`;
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Returns an error message, or "" when the file is valid
export function validatePhoto(file: File) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WebP images are allowed.";
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return "";
}
