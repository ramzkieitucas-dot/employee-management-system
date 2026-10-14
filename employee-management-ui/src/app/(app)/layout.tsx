import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { UserProvider } from "@/components/auth/UserProvider";
import { getCurrentUser } from "@/lib/session";

export default async function ApplicationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-slate-100">
        <Sidebar user={user} />
        <main className="min-h-screen pl-64">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
