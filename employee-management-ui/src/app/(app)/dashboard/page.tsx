import Link from "next/link";
import { getDashboardSummary } from "@/services/dashboard-server";
import { getCurrentUser } from "@/lib/session";
import { canManageEmployees } from "@/lib/roles";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

export default async function DashboardPage() {
  const [summary, user] = await Promise.all([getDashboardSummary(), getCurrentUser()]);

  const cards = [
    { title: "Total Employees", value: summary.totalEmployees, color: "bg-blue-600" },
    { title: "Active Employees", value: summary.activeEmployees, color: "bg-green-600" },
    { title: "On Leave", value: summary.onLeave, color: "bg-amber-500" },
    { title: "Departments", value: summary.totalDepartments, color: "bg-violet-600" },
  ];

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-slate-600">
            Welcome back, {user?.username}. Here is an overview of the system.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/employees"
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            View Employees
          </Link>

          {canManageEmployees(user?.role) && (
            <Link
              href="/employees/add"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Employee
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className={`mb-5 h-2 w-12 rounded-full ${card.color}`} />
            <p className="text-sm font-medium text-slate-500">{card.title}</p>
            <p className="mt-2 text-4xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <DashboardCharts
        byDepartment={summary.byDepartment}
        byStatus={summary.byStatus}
        hiresByMonth={summary.hiresByMonth}
      />

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Hires</h2>
        </div>

        {summary.recentHires.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No employees yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {summary.recentHires.map((hire) => (
              <li key={hire.employeeId}>
                <Link
                  href={`/employees/${hire.employeeId}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {hire.fullName
                        .split(" ")
                        .map((part) => part.charAt(0))
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{hire.fullName}</p>
                      <p className="text-sm text-slate-500">
                        {hire.position || "No position"} · {hire.departmentName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{hire.employeeCode}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(hire.hireDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
