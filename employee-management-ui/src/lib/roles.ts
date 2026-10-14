export function canManageEmployees(role?: string) {
  return role === "Admin" || role === "HR";
}

export function canDeleteEmployees(role?: string) {
  return role === "Admin";
}

export function canManageDepartments(role?: string) {
  return role === "Admin";
}

export function canManageUsers(role?: string) {
  return role === "Admin";
}
