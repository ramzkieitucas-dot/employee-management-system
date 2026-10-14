namespace EmployeeManagement.API.Models;

public static class UserRoles
{
    public const string Admin = "Admin";
    public const string HR = "HR";
    public const string Employee = "Employee";

    public static readonly string[] All = { Admin, HR, Employee };

    public static bool IsValid(string role) => All.Contains(role);
}
