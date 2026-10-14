"use client";

import { useState } from "react";
import { useUser } from "@/components/auth/UserProvider";
import { changeMyPassword } from "@/services/user-service";
import { PASSWORD_RULES, isStrongPassword } from "@/lib/password";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export default function ProfilePage() {
  const user = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("New password doesn't meet the requirements below.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    try {
      setIsSaving(true);
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Your password has been changed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-slate-600">Your account details and password.</p>
      </div>

      {/* Account info */}
      <div className="mb-8 flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-semibold text-slate-900">{user.username}</p>
          <p className="text-sm text-slate-500">{user.email || "No email on file"}</p>
          <span className="mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {user.role}
          </span>
        </div>
      </div>

      {/* Change password */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-5 text-lg font-semibold text-slate-900">Change Password</h2>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {PASSWORD_RULES.map((rule) => {
                const passed = rule.test(newPassword);
                return (
                  <li key={rule.label} className={passed ? "text-green-600" : "text-slate-400"}>
                    {passed ? "✓" : "○"} {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClass}
            />
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="mt-1 text-xs font-medium text-red-600">Passwords don&apos;t match.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
