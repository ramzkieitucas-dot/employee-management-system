using EmployeeManagement.API.Data;
using EmployeeManagement.API.DTOs;
using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IDepartmentService _departmentService;

    public DepartmentsController(ApplicationDbContext context, IDepartmentService departmentService)
    {
        _context = context;
        _departmentService = departmentService;
    }

    // GET: api/departments
    [HttpGet]
    public IActionResult GetDepartments()
    {
        var departments = _context.Departments
            .OrderBy(d => d.DepartmentName)
            .Select(d => new
            {
                d.DepartmentId,
                d.DepartmentName,
                EmployeeCount = d.Employees.Count
            })
            .ToList();

        return Ok(departments);
    }

    // GET: api/departments/1
    [HttpGet("{id:int}")]
    public IActionResult GetDepartment(int id)
    {
        var department = _context.Departments
            .Where(d => d.DepartmentId == id)
            .Select(d => new
            {
                d.DepartmentId,
                d.DepartmentName,
                EmployeeCount = d.Employees.Count
            })
            .FirstOrDefault();

        if (department == null)
        {
            return NotFound();
        }

        return Ok(department);
    }

    // POST: api/departments
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public IActionResult CreateDepartment(DepartmentRequest request)
    {
        var name = request.DepartmentName.Trim();

        if (_departmentService.NameExists(name))
        {
            return Conflict(new { title = "A department with this name already exists." });
        }

        var department = new Department { DepartmentName = name };

        _context.Departments.Add(department);
        _context.SaveChanges();

        return CreatedAtAction(
            nameof(GetDepartment),
            new { id = department.DepartmentId },
            new { department.DepartmentId, department.DepartmentName, EmployeeCount = 0 });
    }

    // PUT: api/departments/1
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public IActionResult UpdateDepartment(int id, DepartmentRequest request)
    {
        var department = _context.Departments.Find(id);

        if (department == null)
        {
            return NotFound();
        }

        var name = request.DepartmentName.Trim();

        if (_departmentService.NameExists(name, id))
        {
            return Conflict(new { title = "A department with this name already exists." });
        }

        department.DepartmentName = name;
        _context.SaveChanges();

        return NoContent();
    }

    // DELETE: api/departments/1
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public IActionResult DeleteDepartment(int id)
    {
        var department = _context.Departments.Find(id);

        if (department == null)
        {
            return NotFound();
        }

        var employeeCount = _departmentService.CountEmployees(id);

        if (employeeCount > 0)
        {
            return Conflict(new
            {
                title = $"Cannot delete this department because it still has {employeeCount} employee(s). Move them to another department first."
            });
        }

        _context.Departments.Remove(department);
        _context.SaveChanges();

        return NoContent();
    }
}
