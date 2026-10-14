namespace EmployeeManagement.API.Models;

public class AuditLog
{
    public long AuditLogId { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Who did it (null for system actions like seeding)
    public int? UserId { get; set; }

    public string Username { get; set; } = "system";

    // Create, Update, Delete (more actions in Step 2)
    public string Action { get; set; } = string.Empty;

    // Employee, Department, User
    public string EntityType { get; set; } = string.Empty;

    public string? EntityId { get; set; }

    // JSON with the changed fields, e.g. {"Position":{"from":"Dev","to":"Senior Dev"}}
    public string? Changes { get; set; }
}