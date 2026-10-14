"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEmployee } from "@/services/employee-service";

interface DeleteEmployeeButtonProps {
  employeeId: number;
  employeeName: string;
  redirectTo?: string;
  variant?: "link" | "button";
}

export default function DeleteEmployeeButton({
  employeeId,
  employeeName,
  redirectTo,
  variant = "link",
}: DeleteEmployeeButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${employeeName}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await deleteEmployee(employeeId);

      if (redirectTo) {
        router.push(redirectTo);
      }

      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete employee.");
    } finally {
      setIsDeleting(false);
    }
  }

  const className =
    variant === "button"
      ? "rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
      : "text-sm font-medium text-red-600 hover:underline disabled:opacity-60";

  return (
    <button type="button" onClick={handleDelete} disabled={isDeleting} className={className}>
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
