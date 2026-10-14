"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartItem, MonthlyHire } from "@/types/dashboard";

const STATUS_COLORS: Record<string, string> = {
  Active: "#16a34a",
  "On Leave": "#f59e0b",
  Inactive: "#94a3b8",
};

const FALLBACK_COLOR = "#6366f1";

interface DashboardChartsProps {
  byDepartment: ChartItem[];
  byStatus: ChartItem[];
  hiresByMonth: MonthlyHire[];
}

function ChartCard({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="h-72">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      No data yet.
    </div>
  );
}

export default function DashboardCharts({
  byDepartment,
  byStatus,
  hiresByMonth,
}: DashboardChartsProps) {
  const hasStatusData = byStatus.some((s) => s.count > 0);
  const hasDepartmentData = byDepartment.length > 0;

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-3">
      <ChartCard title="Employees per Department" className="xl:col-span-2">
        {hasDepartmentData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDepartment} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" name="Employees" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Employee Status">
        {hasStatusData ? (
          <div className="flex h-full flex-col">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="85%"
                  paddingAngle={3}
                >
                  {byStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? FALLBACK_COLOR} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap justify-center gap-4">
              {byStatus.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[entry.name] ?? FALLBACK_COLOR }}
                  />
                  {entry.name} ({entry.count})
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyChart />
        )}
      </ChartCard>

      <ChartCard title="Hires per Month (Last 12 Months)" className="xl:col-span-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={hiresByMonth} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              name="New hires"
              stroke="#7c3aed"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
