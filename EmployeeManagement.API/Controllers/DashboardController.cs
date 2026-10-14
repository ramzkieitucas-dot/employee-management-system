using EmployeeManagement.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public DashboardController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/dashboard/summary
    [HttpGet("summary")]
    public IActionResult GetSummary()
    {
        var totalEmployees = _context.Employees.Count();
        var activeEmployees = _context.Employees.Count(e => e.Status == "Active");
        var onLeave = _context.Employees.Count(e => e.Status == "On Leave");
        var totalDepartments = _context.Departments.Count();

        var byDepartment = _context.Departments
            .Select(d => new
            {
                name = d.DepartmentName,
                count = d.Employees.Count
            })
            .OrderByDescending(d => d.count)
            .ToList();

        var byStatus = _context.Employees
            .GroupBy(e => e.Status)
            .Select(g => new
            {
                name = g.Key,
                count = g.Count()
            })
            .ToList();

        // Hires per month for the last 12 months (including the current month)
        var today = DateTime.Today;
        var start = new DateTime(today.Year, today.Month, 1).AddMonths(-11);

        var hiresRaw = _context.Employees
            .Where(e => e.HireDate >= start)
            .GroupBy(e => new { e.HireDate.Year, e.HireDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Count = g.Count() })
            .ToList();

        var hiresByMonth = Enumerable.Range(0, 12)
            .Select(i => start.AddMonths(i))
            .Select(m => new
            {
                month = m.ToString("MMM yyyy"),
                count = hiresRaw
                    .Where(h => h.Year == m.Year && h.Month == m.Month)
                    .Sum(h => h.Count)
            })
            .ToList();

        var departmentNames = _context.Departments
            .ToDictionary(d => d.DepartmentId, d => d.DepartmentName);

        var recentHires = _context.Employees
            .OrderByDescending(e => e.HireDate)
            .ThenByDescending(e => e.EmployeeId)
            .Take(5)
            .Select(e => new
            {
                e.EmployeeId,
                e.EmployeeCode,
                e.FirstName,
                e.LastName,
                e.Position,
                e.HireDate,
                e.DepartmentId
            })
            .ToList()
            .Select(e => new
            {
                employeeId = e.EmployeeId,
                employeeCode = e.EmployeeCode,
                fullName = $"{e.FirstName} {e.LastName}",
                position = e.Position,
                hireDate = e.HireDate,
                departmentName = departmentNames.GetValueOrDefault(e.DepartmentId, "Unknown")
            })
            .ToList();

        return Ok(new
        {
            totalEmployees,
            activeEmployees,
            onLeave,
            totalDepartments,
            byDepartment,
            byStatus,
            hiresByMonth,
            recentHires
        });
    }
}
