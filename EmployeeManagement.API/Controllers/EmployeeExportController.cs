using ClosedXML.Excel;
using EmployeeManagement.API.Data;
using EmployeeManagement.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/employees/export")]
[Authorize(Roles = "Admin,HR")]
public class EmployeeExportController : ControllerBase
{
    private static readonly string[] Headers =
    {
        "Code", "First Name", "Last Name", "Email", "Phone",
        "Position", "Department", "Hire Date", "Status"
    };

    private readonly ApplicationDbContext _context;

    static EmployeeExportController()
    {
        // Free Community license (for individuals and small companies)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public EmployeeExportController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/employees/export/excel?search=&departmentId=&status=
    [HttpGet("excel")]
    public IActionResult ExportExcel(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? status)
    {
        var rows = GetRows(search, departmentId, status);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Employees");

        for (var c = 0; c < Headers.Length; c++)
        {
            sheet.Cell(1, c + 1).Value = Headers[c];
        }

        var headerRange = sheet.Range(1, 1, 1, Headers.Length);
        headerRange.Style.Font.Bold = true;
        headerRange.Style.Font.FontColor = XLColor.White;
        headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#1E293B");

        for (var i = 0; i < rows.Count; i++)
        {
            var r = i + 2;
            var row = rows[i];

            sheet.Cell(r, 1).Value = row.EmployeeCode;
            sheet.Cell(r, 2).Value = row.FirstName;
            sheet.Cell(r, 3).Value = row.LastName;
            sheet.Cell(r, 4).Value = row.Email;
            // Stored as text so Excel keeps the leading 0
            sheet.Cell(r, 5).Value = row.Phone ?? "";
            sheet.Cell(r, 6).Value = row.Position ?? "";
            sheet.Cell(r, 7).Value = row.DepartmentName;
            sheet.Cell(r, 8).Value = row.HireDate;
            sheet.Cell(r, 8).Style.DateFormat.Format = "yyyy-mm-dd";
            sheet.Cell(r, 9).Value = row.Status;
        }

        if (rows.Count > 0)
        {
            sheet.Range(1, 1, rows.Count + 1, Headers.Length).SetAutoFilter();
        }

        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"employees-{DateTime.Now:yyyyMMdd-HHmm}.xlsx");
    }

    // GET: api/employees/export/pdf?search=&departmentId=&status=
    [HttpGet("pdf")]
    public IActionResult ExportPdf(
        [FromQuery] string? search,
        [FromQuery] int? departmentId,
        [FromQuery] string? status)
    {
        var rows = GetRows(search, departmentId, status);
        var filterText = DescribeFilters(search, departmentId, status);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().PaddingBottom(10).Column(column =>
                {
                    column.Item().Text("Employee List").FontSize(18).Bold();
                    column.Item()
                        .Text($"Generated {DateTime.Now:MMM d, yyyy h:mm tt}  ·  {rows.Count} employee(s)  ·  {filterText}")
                        .FontColor(Colors.Grey.Darken1);
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(55);  // Code
                        columns.RelativeColumn(3);   // Name
                        columns.RelativeColumn(4);   // Email
                        columns.RelativeColumn(2);   // Phone
                        columns.RelativeColumn(3);   // Position
                        columns.RelativeColumn(2);   // Department
                        columns.RelativeColumn(2);   // Hire date
                        columns.RelativeColumn(2);   // Status
                    });

                    table.Header(header =>
                    {
                        foreach (var title in new[] { "Code", "Name", "Email", "Phone", "Position", "Department", "Hire Date", "Status" })
                        {
                            header.Cell()
                                .Background(Colors.BlueGrey.Darken4)
                                .Padding(5)
                                .Text(title).FontColor(Colors.White).Bold();
                        }
                    });

                    for (var i = 0; i < rows.Count; i++)
                    {
                        var row = rows[i];
                        var background = i % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                        var values = new[]
                        {
                            row.EmployeeCode,
                            $"{row.FirstName} {row.LastName}",
                            row.Email,
                            row.Phone ?? "—",
                            string.IsNullOrWhiteSpace(row.Position) ? "—" : row.Position,
                            row.DepartmentName,
                            row.HireDate.ToString("MMM d, yyyy"),
                            row.Status
                        };

                        foreach (var value in values)
                        {
                            table.Cell().Background(background).Padding(5).Text(value);
                        }
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });
            });
        });

        return File(
            document.GeneratePdf(),
            "application/pdf",
            $"employees-{DateTime.Now:yyyyMMdd-HHmm}.pdf");
    }

    // Same filters as GET api/employees/paged, so the export matches the screen
    private List<ExportRow> GetRows(string? search, int? departmentId, string? status)
    {
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

        var departmentNames = _context.Departments
            .ToDictionary(d => d.DepartmentId, d => d.DepartmentName);

        return query
            .OrderBy(e => e.EmployeeCode)
            .ToList()
            .Select(e => new ExportRow(
                e.EmployeeCode,
                e.FirstName,
                e.LastName,
                e.Email,
                e.Phone,
                e.Position,
                departmentNames.GetValueOrDefault(e.DepartmentId, "Unknown"),
                e.HireDate,
                e.Status))
            .ToList();
    }

    private string DescribeFilters(string? search, int? departmentId, string? status)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(search))
        {
            parts.Add($"Search: \"{search.Trim()}\"");
        }

        if (departmentId.HasValue && departmentId > 0)
        {
            var name = _context.Departments.Find(departmentId.Value)?.DepartmentName ?? "Unknown";
            parts.Add($"Department: {name}");
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            parts.Add($"Status: {status}");
        }

        return parts.Count == 0 ? "All employees" : string.Join(", ", parts);
    }

    private record ExportRow(
        string EmployeeCode,
        string FirstName,
        string LastName,
        string Email,
        string? Phone,
        string? Position,
        string DepartmentName,
        DateTime HireDate,
        string Status);
}
