"use client";

import { useState } from "react";
import { apiFetch, getErrorMessage } from "@/lib/api-client";

type ExportFormat = "excel" | "pdf";

interface ExportButtonsProps {
  search: string;
  departmentId: string;
  status: string;
}

function getFileName(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);

  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : fallback;
}

export default function ExportButtons({ search, departmentId, status }: ExportButtonsProps) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);

  async function handleExport(format: ExportFormat) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (departmentId) query.set("departmentId", departmentId);
    if (status) query.set("status", status);

    try {
      setLoading(format);

      const response = await apiFetch(`/employees/export/${format}?${query}`);

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Export failed."));
      }

      const blob = await response.blob();
      const fallback = format === "excel" ? "employees.xlsx" : "employees.pdf";
      const fileName = getFileName(response.headers.get("content-disposition"), fallback);

      // Trigger the browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setLoading(null);
    }
  }

  const buttonClass =
    "rounded-lg border px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleExport("excel")}
        disabled={loading !== null}
        className={`${buttonClass} border-green-600 text-green-700 hover:bg-green-50`}
      >
        {loading === "excel" ? "Exporting..." : "Export Excel"}
      </button>

      <button
        type="button"
        onClick={() => handleExport("pdf")}
        disabled={loading !== null}
        className={`${buttonClass} border-red-600 text-red-700 hover:bg-red-50`}
      >
        {loading === "pdf" ? "Exporting..." : "Export PDF"}
      </button>
    </div>
  );
}
