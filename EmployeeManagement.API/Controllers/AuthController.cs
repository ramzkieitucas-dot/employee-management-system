using System.Security.Claims;
using System.Text;
using EmployeeManagement.API.Data;
using EmployeeManagement.API.DTOs;
using EmployeeManagement.API.Models;
using EmployeeManagement.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher<User> _hasher;
    private readonly IConfiguration _config;

    public AuthController(
        ApplicationDbContext context,
        IPasswordHasher<User> hasher,
        IConfiguration config)
    {
        _context = context;
        _hasher = hasher;
        _config = config;
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login(LoginRequest request)
    {
        var invalid = Unauthorized(new { title = "Invalid username or password." });

        var user = _context.Users.FirstOrDefault(u => u.Username == request.Username.Trim());
        if (user == null)
        {
            return invalid;
        }

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return invalid;
        }

        // Checked after the password, so this message doesn't reveal which usernames exist
        if (!user.IsActive)
        {
            return Unauthorized(new { title = "This account has been deactivated. Please contact an administrator." });
        }

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _hasher.HashPassword(user, request.Password);
            _context.SaveChanges();
        }

        var expires = DateTime.UtcNow.AddMinutes(_config.GetValue("Jwt:ExpiryMinutes", 60));

        return Ok(new LoginResponse
        {
            Token = CreateToken(user, expires),
            ExpiresAt = expires,
            Username = user.Username,
            Role = user.Role
        });
    }

    // GET: api/auth/me
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var user = FindCurrentUser();

        // Deactivated or deleted users are logged out on their next page load
        if (user == null || !user.IsActive)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            userId = user.UserId.ToString(),
            username = user.Username,
            // Role from the token, so the UI matches what the API allows
            role = User.FindFirstValue(ClaimTypes.Role),
            email = user.Email
        });
    }

    // POST: api/auth/change-password
    [HttpPost("change-password")]
    [Authorize]
    public IActionResult ChangePassword(ChangePasswordRequest request)
    {
        var user = FindCurrentUser();
        if (user == null || !user.IsActive)
        {
            return Unauthorized();
        }

        var check = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (check == PasswordVerificationResult.Failed)
        {
            // 400 instead of 401, so the frontend doesn't log the user out
            return BadRequest(new { title = "Current password is incorrect." });
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            return BadRequest(new { title = "New password must be different from the current password." });
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

    private User? FindCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userId, out var id) ? _context.Users.Find(id) : null;
    }

    private string CreateToken(User user, DateTime expires)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = expires,
            Issuer = _config["Jwt:Issuer"],
            Audience = _config["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        };

        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}
