using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.API.DTOs;

public class DepartmentRequest
{
    [Required(ErrorMessage = "Department name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Department name must be 2 to 100 characters.")]
    public string DepartmentName { get; set; } = string.Empty;
}