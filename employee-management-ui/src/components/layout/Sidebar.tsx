import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import { canManageUsers } from "@/lib/roles";
import { CurrentUser } from "@/types/user";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: "📊", adminOnly: false },
  { label: "Employees", href: "/employees", icon: "👥", adminOnly: false },
  { label: "Departments", href: "/departments", icon: "🏢", adminOnly: false },
  { label: "Users", href: "/users", icon: "🔐", adminOnly: true },
  { label: "My Profile", href: "/profile", icon: "👤", adminOnly: false },
];

const linkClass =
  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white";

export default function Sidebar({ user }: { user: CurrentUser }) {
  const isAdmin = canManageUsers(user.role);
  const items = navigationItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-6 py-6">
        <h1 className="text-xl font-bold">Employee MS</h1>
        <p className="mt-1 text-sm text-slate-400">Management Portal</p>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {items.map(({ label, icon, href }) => (
          <Link key={href} href={href} className={linkClass}>
            <span>{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-6 py-5">
        <p className="text-sm font-medium">{user.username}</p>
        <span className="mt-1 inline-flex rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-300">
          {user.role}
        </span>
        <LogoutButton />
      </div>
    </aside>
  );
}
