import Link from "next/link";
import { notFound } from "next/navigation";
import { getDepartments, getEmployee } from "@/services/employee-server";
import { getCurrentUser } from "@/lib/session";
import { canDeleteEmployees, canManageEmployees } from "@/lib/roles";
import DeleteEmployeeButton from "@/components/employees/DeleteEmployeeButton";
import EmployeeAvatar from "@/components/employees/EmployeeAvatar";

export default async function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Run all API calls at the same time
  const [employee, departments, user] = await Promise.all([
    getEmployee(Number(id)),
    getDepartments(),
    getCurrentUser(),
  ]);

  if (!employee) {
    notFound();
  }

  const departmentName =
    departments.find((d) => d.departmentId === employee.departmentId)?.departmentName ??
    "Unknown";

  const hireDate = new Date(employee.hireDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const details = [
    { label: "Employee Code", value: employee.employeeCode },
    { label: "Email", value: employee.email },
    { label: "Phone", value: employee.phone || "—" },
    { label: "Position", value: employee.position || "—" },
    { label: "Department", value: departmentName },
    { label: "Hire Date", value: hireDate },
    { label: "Status", value: employee.status },
  ];

  return (
    <section className="max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <EmployeeAvatar
            firstName={employee.firstName}
            lastName={employee.lastName}
            profileImageUrl={employee.profileImageUrl}
            size="lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="mt-1 text-slate-600">
              {employee.position} · {departmentName}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            employee.status === "Active"
              ? "bg-green-100 text-green-700"
              : employee.status === "On Leave"
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-200 text-slate-700"
          }`}
        >
          {employee.status}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <dl className="grid gap-6 md:grid-cols-2">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
              <dd className="mt-1 text-slate-900">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Link
          href="/employees"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Back
        </Link>

        {canManageEmployees(user?.role) && (
          <Link
            href={`/employees/edit/${employee.employeeId}`}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Edit
          </Link>
        )}

        {canDeleteEmployees(user?.role) && (
          <DeleteEmployeeButton
            employeeId={employee.employeeId}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            redirectTo="/employees"
            variant="button"
          />
        )}
      </div>
    </section>
  );
}
