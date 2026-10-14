using EmployeeManagement.API.Data;
using EmployeeManagement.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.Tests;

// Creates a fresh in-memory database for each test
public static class TestDb
{
    public static ApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    public static Employee NewEmployee(string code, string email, int departmentId) => new()
    {
        EmployeeCode = code,
        FirstName = "Test",
        LastName = "User",
        Email = email,
        Phone = "09123456789",
        Position = "Developer",
        HireDate = DateTime.Today,
        Status = "Active",
        DepartmentId = departmentId
    };
}
