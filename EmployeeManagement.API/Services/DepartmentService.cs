using EmployeeManagement.API.Data;

namespace EmployeeManagement.API.Services;

public interface IDepartmentService
{
    bool NameExists(string name, int? excludeDepartmentId = null);
    int CountEmployees(int departmentId);
    bool CanDelete(int departmentId);
}

public class DepartmentService : IDepartmentService
{
    private readonly ApplicationDbContext _context;

    public DepartmentService(ApplicationDbContext context)
    {
        _context = context;
    }

    public bool NameExists(string name, int? excludeDepartmentId = null)
    {
        var normalized = name.Trim().ToLower();

        return _context.Departments.Any(d =>
            d.DepartmentName.ToLower() == normalized &&
            (excludeDepartmentId == null || d.DepartmentId != excludeDepartmentId));
    }

    public int CountEmployees(int departmentId)
    {
        return _context.Employees.Count(e => e.DepartmentId == departmentId);
    }

    public bool CanDelete(int departmentId)
    {
        return CountEmployees(departmentId) == 0;
    }
}
