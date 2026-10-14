// Same rules as PasswordRules.cs in the API
export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
];

export function isStrongPassword(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
