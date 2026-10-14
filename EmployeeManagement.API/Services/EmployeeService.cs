using EmployeeManagement.API.Data;

namespace EmployeeManagement.API.Services;

public interface IEmployeeService
{
    string GenerateNextCode();
    bool IsEmailInUse(string email, int? excludeEmployeeId = null);
}

public class EmployeeService : IEmployeeService
{
    private readonly ApplicationDbContext _context;

    public EmployeeService(ApplicationDbContext context)
    {
        _context = context;
    }

    public string GenerateNextCode()
    {
        var codes = _context.Employees.Select(e => e.EmployeeCode).ToList();
        return EmployeeCodeGenerator.Next(codes);
    }

    public bool IsEmailInUse(string email, int? excludeEmployeeId = null)
    {
        var normalized = email.Trim().ToLower();

        return _context.Employees.Any(e =>
            e.Email.ToLower() == normalized &&
            (excludeEmployeeId == null || e.EmployeeId != excludeEmployeeId));
    }
}
