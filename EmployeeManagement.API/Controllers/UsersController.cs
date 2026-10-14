using System.Security.Claims;
using EmployeeManagement.API.Data;
using EmployeeManagement.API.DTOs;
using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = UserRoles.Admin)]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher<User> _hasher;

    public UsersController(ApplicationDbContext context, IPasswordHasher<User> hasher)
    {
        _context = context;
        _hasher = hasher;
    }

    // GET: api/users
    [HttpGet]
    public IActionResult GetUsers()
    {
        var users = _context.Users
            .OrderBy(u => u.Username)
            .Select(u => new
            {
                u.UserId,
                u.Username,
                u.Email,
                u.Role,
                u.IsActive,
                u.CreatedAt
            })
            .ToList();

        return Ok(users);
    }

    // POST: api/users
    [HttpPost]
    public IActionResult CreateUser(CreateUserRequest request)
    {
        var username = request.Username.Trim();

        if (!UserRoles.IsValid(request.Role))
        {
            return BadRequest(new { title = "Role must be Admin, HR, or Employee." });
        }

        if (_context.Users.Any(u => u.Username.ToLower() == username.ToLower()))
        {
            return Conflict(new { title = "Username is already taken." });
        }

        var passwordError = PasswordRules.Validate(request.Password);
        if (passwordError != null)
        {
            return BadRequest(new { title = passwordError });
        }

        var user = new User
        {
            Username = username,
            Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLower(),
            Role = request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = _hasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        _context.SaveChanges();

        return Ok(new { user.UserId, user.Username, user.Email, user.Role, user.IsActive, user.CreatedAt });
    }

    // PUT: api/users/1   (email, role, active status)
    [HttpPut("{id:int}")]
    public IActionResult UpdateUser(int id, UpdateUserRequest request)
    {
        var user = _context.Users.Find(id);

        if (user == null)
        {
            return NotFound();
        }

        if (!UserRoles.IsValid(request.Role))
        {
            return BadRequest(new { title = "Role must be Admin, HR, or Employee." });
        }

        var losesAdmin = user.Role == UserRoles.Admin && user.IsActive &&
                         (request.Role != UserRoles.Admin || !request.IsActive);

        if (losesAdmin)
        {
            if (id == GetCurrentUserId())
            {
                return BadRequest(new { title = "You can't remove your own Admin role or deactivate your own account." });
            }

            var otherActiveAdmins = _context.Users.Count(u =>
                u.UserId != id && u.Role == UserRoles.Admin && u.IsActive);

            if (otherActiveAdmins == 0)
            {
                return BadRequest(new { title = "The system must keep at least one active Admin." });
            }
        }

        user.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim().ToLower();
        user.Role = request.Role;
        user.IsActive = request.IsActive;

        _context.SaveChanges();

        return NoContent();
    }

    // POST: api/users/1/reset-password
    [HttpPost("{id:int}/reset-password")]
    public IActionResult ResetPassword(int id, ResetPasswordRequest request)
    {
        var user = _context.Users.Find(id);

        if (user == null)
        {
            return NotFound();
        }

        var passwordError = PasswordRules.Validate(request.NewPassword);
        if (passwordError != null)
        {
            return BadRequest(new { title = passwordError });
        }

        user.PasswordHash = _hasher.HashPassword(user, request.NewPassword);
        _context.SaveChanges();

        return NoContent();
    }

    private int GetCurrentUserId()
    {
        return int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    }
}
