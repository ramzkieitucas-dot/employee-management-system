import Link from "next/link";
import Form from "next/form";
import { getDepartments, getEmployeesPaged } from "@/services/employee-server";
import { getCurrentUser } from "@/lib/session";
import { canDeleteEmployees, canManageEmployees } from "@/lib/roles";
import DeleteEmployeeButton from "@/components/employees/DeleteEmployeeButton";
import EmployeeAvatar from "@/components/employees/EmployeeAvatar";
import ExportButtons from "@/components/employees/ExportButtons";

const PAGE_SIZE = 10;

const fieldClass =
  "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const navButtonClass =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100";

const disabledButtonClass =
  "cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-300";

type SearchParams = {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: string;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const search = params.search?.trim() ?? "";
  const departmentId = params.departmentId ?? "";
  const status = params.status ?? "";
  const page = Math.max(Number(params.page) || 1, 1);

  const [result, departments, user] = await Promise.all([
    getEmployeesPaged({ search, departmentId, status, page, pageSize: PAGE_SIZE }),
    getDepartments(),
    getCurrentUser(),
  ]);

  const canEdit = canManageEmployees(user?.role);
  const canDelete = canDeleteEmployees(user?.role);

  const { items: employees, totalCount, totalPages } = result;

  const departmentNames = new Map(departments.map((d) => [d.departmentId, d.departmentName]));

  const hasFilters = Boolean(search || departmentId || status);

  // Builds a link to another page while keeping the current filters
  function pageHref(targetPage: number) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (departmentId) query.set("departmentId", departmentId);
    if (status) query.set("status", status);
    query.set("page", String(targetPage));
    return `/employees?${query}`;
  }

  const firstItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalCount);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1
  );

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="mt-1 text-slate-600">View and manage employee records.</p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons search={search} departmentId={departmentId} status={status} />
            <Link
              href="/employees/add"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add Employee
            </Link>
          </div>
        )}
      </div>

      {/* Search & filters */}
      <Form
        action="/employees"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search name, email, code, or position..."
          className={`${fieldClass} min-w-64 flex-1`}
        />

        <select name="departmentId" defaultValue={departmentId} className={fieldClass}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={status} className={fieldClass}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="On Leave">On Leave</option>
        </select>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Search
        </button>

        {hasFilters && (
          <Link
            href="/employees"
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Clear
          </Link>
        )}
      </Form>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                {["Code", "Employee", "Position", "Department", "Status", "Actions"].map(
                  (heading) => (
                    <th key={heading} className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {employees.map((employee) => (
                <tr key={employee.employeeId} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{employee.employeeCode}</td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        firstName={employee.firstName}
                        lastName={employee.lastName}
                        profileImageUrl={employee.profileImageUrl}
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{employee.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {employee.position || "Not assigned"}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {departmentNames.get(employee.departmentId) ?? "Unknown"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        employee.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : employee.status === "On Leave"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/employees/${employee.employeeId}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </Link>

                      {canEdit && (
                        <Link
                          href={`/employees/edit/${employee.employeeId}`}
                          className="text-sm font-medium text-amber-600 hover:underline"
                        >
                          Edit
                        </Link>
                      )}

                      {canDelete && (
                        <DeleteEmployeeButton
                          employeeId={employee.employeeId}
                          employeeName={`${employee.firstName} ${employee.lastName}`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {hasFilters
                      ? "No employees match your search or filters."
                      : "No employees found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold">{firstItem}</span>–
            <span className="font-semibold">{lastItem}</span> of{" "}
            <span className="font-semibold">{totalCount}</span> employees
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={navButtonClass}>
                  Previous
                </Link>
              ) : (
                <span className={disabledButtonClass}>Previous</span>
              )}

              {pageNumbers.map((n, index) => {
                const showGap = index > 0 && n - pageNumbers[index - 1] > 1;

                return (
                  <span key={n} className="flex items-center gap-2">
                    {showGap && <span className="text-slate-400">…</span>}
                    {n === page ? (
                      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white">
                        {n}
                      </span>
                    ) : (
                      <Link href={pageHref(n)} className={navButtonClass}>
                        {n}
                      </Link>
                    )}
                  </span>
                );
              })}

              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className={navButtonClass}>
                  Next
                </Link>
              ) : (
                <span className={disabledButtonClass}>Next</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
