using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;

namespace EmployeeManagement.Tests;

public class EmployeeServiceTests
{
    [Fact]
    public void IsEmailInUse_IsCaseInsensitive()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "IT" });
        db.Employees.Add(TestDb.NewEmployee("EMP001", "juan@example.com", 1));
        db.SaveChanges();

        var service = new EmployeeService(db);

        Assert.True(service.IsEmailInUse("JUAN@example.com"));
        Assert.False(service.IsEmailInUse("maria@example.com"));
    }

    [Fact]
    public void IsEmailInUse_IgnoresTheEmployeeBeingEdited()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "IT" });
        var juan = TestDb.NewEmployee("EMP001", "juan@example.com", 1);
        db.Employees.Add(juan);
        db.SaveChanges();

        var service = new EmployeeService(db);

        // Editing Juan and keeping his own email is allowed
        Assert.False(service.IsEmailInUse("juan@example.com", juan.EmployeeId));
    }

    [Fact]
    public void GenerateNextCode_UsesExistingEmployees()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "IT" });
        db.Employees.Add(TestDb.NewEmployee("EMP004", "a@example.com", 1));
        db.Employees.Add(TestDb.NewEmployee("EMP010", "b@example.com", 1));
        db.SaveChanges();

        var service = new EmployeeService(db);

        Assert.Equal("EMP011", service.GenerateNextCode());
    }
}
