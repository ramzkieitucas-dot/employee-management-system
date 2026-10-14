import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { canManageUsers } from "@/lib/roles";
import UsersManager from "@/components/users/UsersManager";

export default async function UsersPage() {
  const user = await getCurrentUser();

  // Non-admins are sent back to the dashboard (the API also blocks them with 403)
  if (!user || !canManageUsers(user.role)) {
    redirect("/dashboard");
  }

  return <UsersManager currentUserId={Number(user.userId)} />;
}
