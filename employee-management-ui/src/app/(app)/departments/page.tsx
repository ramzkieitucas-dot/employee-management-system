"use client";

import { useEffect, useState } from "react";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentList,
  updateDepartment,
} from "@/services/department-service";
import { useUser } from "@/components/auth/UserProvider";
import { canManageDepartments } from "@/lib/roles";
import { Department } from "@/types/department";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function validateName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "Department name is required.";
  if (trimmed.length < 2) return "Department name must be at least 2 characters.";
  if (trimmed.length > 100) return "Department name must be 100 characters or less.";
  return "";
}

export default function DepartmentsPage() {
  const user = useUser();
  const canManage = canManageDepartments(user.role);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDepartments() {
    try {
      setDepartments(await getDepartmentList());
    } catch {
      setError("Unable to load departments. Is the API running?");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  function showSuccess(message: string) {
    setError("");
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");

    const validationError = validateName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsAdding(true);
      await createDepartment(newName.trim());
      setNewName("");
      await loadDepartments();
      showSuccess("Department added.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add department.");
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(department: Department) {
    setError("");
    setEditingId(department.departmentId);
    setEditingName(department.departmentName);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleUpdate(id: number) {
    const validationError = validateName(editingName);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await updateDepartment(id, editingName.trim());
      cancelEdit();
      await loadDepartments();
      showSuccess("Department updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update department.");
    }
  }

  async function handleDelete(department: Department) {
    const confirmed = window.confirm(
      `Delete the ${department.departmentName} department? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteDepartment(department.departmentId);
      await loadDepartments();
      showSuccess("Department deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete department.");
    }
  }

  return (
    <section className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Departments</h1>
        <p className="mt-1 text-slate-600">
          {canManage ? "Add, rename, and remove departments." : "View the list of departments."}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {canManage && (
        <form
          onSubmit={handleAdd}
          noValidate
          className="mb-8 flex gap-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input
            value={newName}
            onChange={(event) => {
              setNewName(event.target.value);
              setError("");
            }}
            placeholder="New department name (e.g., Engineering)"
            maxLength={100}
            className={inputClass}
          />

          <button
            type="submit"
            disabled={isAdding}
            className="whitespace-nowrap rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isAdding ? "Adding..." : "Add Department"}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["Department", "Employees", "Actions"].map((heading) => (
                <th key={heading} className="px-6 py-4 text-sm font-semibold text-slate-700">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  Loading departments...
                </td>
              </tr>
            )}

            {!isLoading && departments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                  No departments yet.
                </td>
              </tr>
            )}

            {departments.map((department) => {
              const isEditing = editingId === department.departmentId;
              const count = department.employeeCount ?? 0;

              return (
                <tr key={department.departmentId} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        maxLength={100}
                        autoFocus
                        className={inputClass}
                      />
                    ) : (
                      <span className="font-medium text-slate-900">
                        {department.departmentName}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {count} {count === 1 ? "employee" : "employees"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {!canManage ? (
                      <span className="text-sm text-slate-400">View only</span>
                    ) : isEditing ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdate(department.departmentId)}
                          className="text-sm font-medium text-green-600 hover:underline"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="text-sm font-medium text-slate-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(department)}
                          className="text-sm font-medium text-amber-600 hover:underline"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(department)}
                          disabled={count > 0}
                          title={count > 0 ? "Move this department's employees first" : ""}
                          className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-300 disabled:no-underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
