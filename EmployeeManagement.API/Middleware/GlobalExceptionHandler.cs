using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Middleware;

// Turns any unhandled exception into a consistent ProblemDetails JSON response.
// The frontend already reads "title" from errors, so messages show up in the red boxes.
public class GlobalExceptionHandler : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger, IHostEnvironment env)
    {
        _logger = logger;
        _env = env;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception on {Method} {Path}",
            httpContext.Request.Method, httpContext.Request.Path);

        var (status, title) = exception switch
        {
            DbUpdateException => (StatusCodes.Status409Conflict,
                "The change could not be saved because it conflicts with existing data."),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden,
                "You don't have permission to do this."),
            _ => (StatusCodes.Status500InternalServerError,
                "Something went wrong on the server. Please try again.")
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Instance = httpContext.Request.Path
        };

        // Show technical details only while developing
        if (_env.IsDevelopment())
        {
            problem.Detail = exception.Message;
        }

        problem.Extensions["traceId"] = httpContext.TraceIdentifier;

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }
}
