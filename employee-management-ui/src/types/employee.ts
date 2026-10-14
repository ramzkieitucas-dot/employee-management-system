export interface Employee {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  hireDate: string;
  status: string;
  departmentId: number;
  profileImageUrl?: string | null;
}
