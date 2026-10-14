"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FieldErrors = { username?: string; password?: string };

const REMEMBER_KEY = "ems_remembered_username";


function inputClass(hasError: boolean) {
  const base =
    "w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2";
  return hasError
    ? `${base} border-red-500 focus:ring-red-100`
    : `${base} border-slate-300 focus:border-blue-500 focus:ring-blue-100`;
}

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered username and "session expired" notice
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setUsername(saved);
      setRememberMe(true);
    }

    const query = new URLSearchParams(window.location.search);
    if (query.get("expired") === "1") {
      setNotice("Your session has expired. Please sign in again.");
    }
  }, []);

  function handleCapsLock(event: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState("CapsLock"));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!username.trim()) errors.username = "Username is required.";
    if (!password) errors.password = "Password is required.";
    return errors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.title ?? "Login failed.");
        setPassword("");
        return;
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, username.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <main className="flex min-h-screen bg-slate-100">
      {/* Left: branding panel (hidden on small screens) */}
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
            EM
          </div>
          <span className="text-xl font-bold">Employee MS</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Manage your workforce
            <br />
            in one place.
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            A full-stack HR portal built with Next.js, ASP.NET Core, and SQL Server.
          </p>

  
        </div>

        <p className="relative text-sm text-slate-500">
          © {new Date().getFullYear()} Employee Management System
        </p>
      </section>

      {/* Right: login form */}
      <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              EM
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">Welcome back 👋</h1>
          <p className="mt-2 text-slate-500">Sign in to your account to continue.</p>

          {notice && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  👤
                </span>
                <input
                  id="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setFieldErrors((current) => ({ ...current, username: undefined }));
                  }}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className={inputClass(!!fieldErrors.username)}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  🔒
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  onKeyUp={handleCapsLock}
                  onKeyDown={handleCapsLock}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`${inputClass(!!fieldErrors.password)} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
              )}
              {capsLockOn && (
                <p className="mt-1 text-xs font-medium text-amber-600">⚠ Caps Lock is on</p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-blue-600"
              />
              Remember my username
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          
        </div>
      </section>
    </main>
  );
}
