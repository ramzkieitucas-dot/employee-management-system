"use client";

import { useRouter } from "next/navigation";
import EmployeeForm, { PhotoChange } from "@/components/employees/EmployeeForm";
import {
  createEmployee,
  uploadEmployeePhoto,
  EmployeeRequest,
} from "@/services/employee-service";

export default function AddEmployeePage() {
  const router = useRouter();

  async function handleSubmit(payload: EmployeeRequest, photo: PhotoChange) {
    const employee = await createEmployee(payload);

    if (photo.file) {
      try {
        await uploadEmployeePhoto(employee.employeeId, photo.file);
      } catch (err) {
        // The employee is already saved, so don't block. Just tell the user.
        const message = err instanceof Error ? err.message : "Unknown error";
        window.alert(`Employee saved, but the photo upload failed: ${message}`);
      }
    }

    router.push(`/employees/${employee.employeeId}`);
    router.refresh();
  }

  return (
    <section className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Add Employee</h1>
        <p className="mt-1 text-slate-600">Fields marked with * are required.</p>
      </div>

      <EmployeeForm submitLabel="Save Employee" onSubmit={handleSubmit} />
    </section>
  );
}
