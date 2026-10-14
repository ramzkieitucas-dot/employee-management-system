export interface ChartItem {
  name: string;
  count: number;
}

export interface MonthlyHire {
  month: string;
  count: number;
}

export interface RecentHire {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  position?: string;
  hireDate: string;
  departmentName: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  totalDepartments: number;
  byDepartment: ChartItem[];
  byStatus: ChartItem[];
  hiresByMonth: MonthlyHire[];
  recentHires: RecentHire[];
}
