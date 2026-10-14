using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.API.DTOs;

public class CreateUserRequest
{
    [Required(ErrorMessage = "Username is required.")]
    [RegularExpression(@"^[A-Za-z0-9._-]{3,50}$",
        ErrorMessage = "Username must be 3 to 50 characters: letters, numbers, dot, dash, or underscore.")]
    public string Username { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Role is required.")]
    public string Role { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
    [EmailAddress(ErrorMessage = "Enter a valid email address.")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "Role is required.")]
    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}

public class ResetPasswordRequest
{
    [Required(ErrorMessage = "New password is required.")]
    public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required(ErrorMessage = "Current password is required.")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required.")]
    public string NewPassword { get; set; } = string.Empty;
}
