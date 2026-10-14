namespace EmployeeManagement.API.Services;

public static class PasswordRules
{
    // Returns an error message, or null when the password is valid
    public static string? Validate(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8)
            return "Password must be at least 8 characters.";

        if (!password.Any(char.IsUpper))
            return "Password must contain an uppercase letter.";

        if (!password.Any(char.IsLower))
            return "Password must contain a lowercase letter.";

        if (!password.Any(char.IsDigit))
            return "Password must contain a number.";

        return null;
    }
}
