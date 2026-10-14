"use client";

import { useEffect, useState } from "react";
import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from "@/services/user-service";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";
import { ROLES, Role, UserAccount } from "@/types/user";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/;

const emptyForm = { username: "", email: "", password: "", role: "Employee" as Role };

export default function UsersManager({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [isAdding, setIsAdding] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    try {
      setUsers(await getUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function showSuccess(message: string) {
    setError("");
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  }

  function validateForm() {
    if (!USERNAME_REGEX.test(form.username.trim()))
      return "Username must be 3 to 50 characters: letters, numbers, dot, dash, or underscore.";
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim()))
      return "Enter a valid email address.";
    if (!isStrongPassword(form.password))
      return "Password must be at least 8 characters with uppercase, lowercase, and a number.";
    return "";
  }

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsAdding(true);
      await createUser({
        username: form.username.trim(),
        email: form.email.trim() || null,
        password: form.password,
        role: form.role,
      });
      setForm(emptyForm);
      await loadUsers();
      showSuccess("User created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setIsAdding(false);
    }
  }

  async function saveUser(user: UserAccount, changes: Partial<Pick<UserAccount, "role" | "isActive">>) {
    try {
      setBusyId(user.userId);
      await updateUser(user.userId, {
        email: user.email ?? null,
        role: changes.role ?? user.role,
        isActive: changes.isActive ?? user.isActive,
      });
      await loadUsers();
      showSuccess(`${user.username} updated.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(user: UserAccount) {
    const action = user.isActive ? "Deactivate" : "Activate";
    if (!window.confirm(`${action} ${user.username}?`)) return;
    await saveUser(user, { isActive: !user.isActive });
  }

  async function handleResetPassword(user: UserAccount) {
    const newPassword = window.prompt(
      `New password for ${user.username}\n(8+ characters, uppercase, lowercase, and a number):`
    );
    if (newPassword === null) return;

    if (!isStrongPassword(newPassword)) {
      setError("Password must be at least 8 characters with uppercase, lowercase, and a number.");
      return;
    }

    try {
      setBusyId(user.userId);
      await resetUserPassword(user.userId, newPassword);
      showSuccess(`Password reset for ${user.username}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-slate-600">Manage login accounts, roles, and access.</p>
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

      {/* Add user */}
      <form
        onSubmit={handleAdd}
        noValidate
        className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add User</h2>

        <div className="grid gap-4 md:grid-cols-4">
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            autoComplete="off"
            className={inputClass}
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email (optional)"
            className={inputClass}
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Temporary password"
            autoComplete="new-password"
            className={inputClass}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className={inputClass}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {PASSWORD_RULES.map((rule) => {
              const passed = rule.test(form.password);
              return (
                <li key={rule.label} className={passed ? "text-green-600" : "text-slate-400"}>
                  {passed ? "✓" : "○"} {rule.label}
                </li>
              );
            })}
          </ul>

          <button
            type="submit"
            disabled={isAdding}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isAdding ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>

      {/* User list */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {["User", "Role", "Status", "Created", "Actions"].map((heading) => (
                <th key={heading} className="px-6 py-4 text-sm font-semibold text-slate-700">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Loading users...
                </td>
              </tr>
            )}

            {users.map((user) => {
              const isSelf = user.userId === currentUserId;
              const isBusy = busyId === user.userId;

              return (
                <tr key={user.userId} className={user.isActive ? "" : "bg-slate-50 text-slate-400"}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {user.username}
                      {isSelf && <span className="ml-2 text-xs font-normal text-blue-600">(you)</span>}
                    </p>
                    <p className="text-sm text-slate-500">{user.email || "No email"}</p>
                  </td>

                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      disabled={isSelf || isBusy}
                      title={isSelf ? "You can't change your own role" : ""}
                      onChange={(e) => saveUser(user, { role: e.target.value as Role })}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        user.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleResetPassword(user)}
                        disabled={isBusy}
                        className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
                      >
                        Reset Password
                      </button>

                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isBusy}
                          className={`text-sm font-medium hover:underline disabled:opacity-50 ${
                            user.isActive ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Role changes take effect the next time the user logs in. Deactivated users are signed out on
        their next page load.
      </p>
    </section>
  );
}
