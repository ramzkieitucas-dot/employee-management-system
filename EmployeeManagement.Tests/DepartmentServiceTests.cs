using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;

namespace EmployeeManagement.Tests;

public class DepartmentServiceTests
{
    [Fact]
    public void CanDelete_FalseWhenDepartmentHasEmployees()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "IT" });
        db.Departments.Add(new Department { DepartmentId = 2, DepartmentName = "HR" });
        db.Employees.Add(TestDb.NewEmployee("EMP001", "juan@example.com", 1));
        db.SaveChanges();

        var service = new DepartmentService(db);

        Assert.False(service.CanDelete(1));
        Assert.Equal(1, service.CountEmployees(1));
        Assert.True(service.CanDelete(2));
    }

    [Fact]
    public void NameExists_IsCaseInsensitiveAndTrimmed()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "Finance" });
        db.SaveChanges();

        var service = new DepartmentService(db);

        Assert.True(service.NameExists("  finance "));
        Assert.False(service.NameExists("Marketing"));
    }

    [Fact]
    public void NameExists_IgnoresTheDepartmentBeingRenamed()
    {
        using var db = TestDb.Create();
        db.Departments.Add(new Department { DepartmentId = 1, DepartmentName = "Finance" });
        db.SaveChanges();

        var service = new DepartmentService(db);

        Assert.False(service.NameExists("FINANCE", excludeDepartmentId: 1));
    }
}
