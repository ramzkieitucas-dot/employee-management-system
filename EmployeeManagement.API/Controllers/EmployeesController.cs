using EmployeeManagement.API.Data;
using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private const long MaxPhotoBytes = 2 * 1024 * 1024; // 2 MB
    private const string PhotoFolder = "uploads/employees";

    private static readonly Dictionary<string, string> AllowedPhotoTypes = new()
    {
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".webp", "image/webp" }
    };

    private readonly ApplicationDbContext _context;
    private readonly IEmployeeService _employeeService;
    private readonly IWebHostEnvironment _env;

    public EmployeesController(
        ApplicationDbContext context,
        IEmployeeService employeeService,
        IWebHostEnvironment env)
    {
        _context = context;
        _employeeService = employeeService;
        _env = env;
    }

    // GET: api/employees
    [HttpGet]
    public IActionResult GetEmployees()
    {
        return Ok(_context.Employees.ToList());
    }

    // GET: api/employees/1
    [HttpGet("{id:int}")]
    public IActionResult GetEmployee(int id)
    {
        var employee = _context.Employees.Find(id);

        if (employee == null)
        {
            return NotFound();
        }

        return Ok(employee);
    }

    // GET: api/employees/paged?search=&departmentId=&status=&page=1&pageSize=10
    [HttpGet("paged")]
    public IActionResult GetPagedEmployees(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var query = _context.Employees.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();

            query = query.Where(e =>
                e.EmployeeCode.Contains(term) ||
                e.FirstName.Contains(term) ||
                e.LastName.Contains(term) ||
                (e.FirstName + " " + e.LastName).Contains(term) ||
                e.Email.Contains(term) ||
                (e.Position != null && e.Position.Contains(term)));
        }

        if (departmentId.HasValue && departmentId > 0)
        {
            query = query.Where(e => e.DepartmentId == departmentId);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(e => e.Status == status);
        }

        var totalCount = query.Count();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = query
            .OrderBy(e => e.EmployeeCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new { items, totalCount, page, pageSize, totalPages });
    }

    // POST: api/employees
    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public IActionResult CreateEmployee(Employee employee)
    {
        if (_employeeService.IsEmailInUse(employee.Email))
        {
            return Conflict(new { title = "Email is already used by another employee." });
        }

        employee.EmployeeCode = _employeeService.GenerateNextCode();
        employee.ProfileImageUrl = null; // Photos are set only through the upload endpoint

        _context.Employees.Add(employee);
        _context.SaveChanges();

        return CreatedAtAction(nameof(GetEmployee), new { id = employee.EmployeeId }, employee);
    }

    // PUT: api/employees/1
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,HR")]
    public IActionResult UpdateEmployee(int id, Employee employee)
    {
        var existingEmployee = _context.Employees.Find(id);

        if (existingEmployee == null)
        {
            return NotFound();
        }

        if (_employeeService.IsEmailInUse(employee.Email, id))
        {
            return Conflict(new { title = "Email is already used by another employee." });
        }

        // EmployeeCode and ProfileImageUrl are intentionally not updated here
        existingEmployee.FirstName = employee.FirstName;
        existingEmployee.LastName = employee.LastName;
        existingEmployee.Email = employee.Email;
        existingEmployee.Phone = employee.Phone;
        existingEmployee.Position = employee.Position;
        existingEmployee.HireDate = employee.HireDate;
        existingEmployee.Status = employee.Status;
        existingEmployee.DepartmentId = employee.DepartmentId;

        _context.SaveChanges();

        return NoContent();
    }

    // DELETE: api/employees/1
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public IActionResult DeleteEmployee(int id)
    {
        var employee = _context.Employees.Find(id);

        if (employee == null)
        {
            return NotFound();
        }

        var oldPhoto = employee.ProfileImageUrl;

        _context.Employees.Remove(employee);
        _context.SaveChanges();

        DeletePhotoFile(oldPhoto);

        return NoContent();
    }

    // POST: api/employees/1/photo  (multipart/form-data, field name "file")
    [HttpPost("{id:int}/photo")]
    [Authorize(Roles = "Admin,HR")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile? file)
    {
        var employee = _context.Employees.Find(id);

        if (employee == null)
        {
            return NotFound();
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { title = "Please choose an image file." });
        }

        if (file.Length > MaxPhotoBytes)
        {
            return BadRequest(new { title = "Image must be 2 MB or smaller." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedPhotoTypes.TryGetValue(extension, out var expectedType) ||
            !string.Equals(file.ContentType, expectedType, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { title = "Only JPG, PNG, or WebP images are allowed." });
        }

        var folder = Path.Combine(GetWebRoot(), "uploads", "employees");
        Directory.CreateDirectory(folder);

        var fileName = $"{employee.EmployeeId}-{Guid.NewGuid():N}{extension}";
        var fullPath = Path.Combine(folder, fileName);

        await using (var stream = System.IO.File.Create(fullPath))
        {
            await file.CopyToAsync(stream);
        }

        var oldPhoto = employee.ProfileImageUrl;

        employee.ProfileImageUrl = $"/{PhotoFolder}/{fileName}";
        _context.SaveChanges();

        DeletePhotoFile(oldPhoto);

        return Ok(new { profileImageUrl = employee.ProfileImageUrl });
    }

    // DELETE: api/employees/1/photo
    [HttpDelete("{id:int}/photo")]
    [Authorize(Roles = "Admin,HR")]
    public IActionResult DeletePhoto(int id)
    {
        var employee = _context.Employees.Find(id);

        if (employee == null)
        {
            return NotFound();
        }

        var oldPhoto = employee.ProfileImageUrl;

        employee.ProfileImageUrl = null;
        _context.SaveChanges();

        DeletePhotoFile(oldPhoto);

        return NoContent();
    }

    private string GetWebRoot()
    {
        return string.IsNullOrEmpty(_env.WebRootPath)
            ? Path.Combine(_env.ContentRootPath, "wwwroot")
            : _env.WebRootPath;
    }

    private void DeletePhotoFile(string? relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
        {
            return;
        }

        // Only delete files inside our uploads folder
        var fileName = Path.GetFileName(relativeUrl);
        var fullPath = Path.Combine(GetWebRoot(), "uploads", "employees", fileName);

        if (System.IO.File.Exists(fullPath))
        {
            System.IO.File.Delete(fullPath);
        }
    }
}
