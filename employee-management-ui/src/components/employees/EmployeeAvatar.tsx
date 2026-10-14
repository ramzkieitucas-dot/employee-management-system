import { getInitials, getPhotoUrl } from "@/lib/photo";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl",
};

interface EmployeeAvatarProps {
  firstName: string;
  lastName: string;
  profileImageUrl?: string | null;
  size?: keyof typeof SIZES;
}

// Works in both Server and Client Components (no hooks)
export default function EmployeeAvatar({
  firstName,
  lastName,
  profileImageUrl,
  size = "sm",
}: EmployeeAvatarProps) {
  const url = getPhotoUrl(profileImageUrl);
  const sizeClass = SIZES[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 ring-2 ring-white`}
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
