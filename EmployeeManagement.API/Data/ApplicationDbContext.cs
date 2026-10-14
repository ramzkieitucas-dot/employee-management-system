using System.Security.Claims;
using System.Text.Json;
using EmployeeManagement.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace EmployeeManagement.API.Data;

public class ApplicationDbContext : DbContext
{
    // Never write these values into the audit log
    private static readonly HashSet<string> SensitiveProperties = new() { "PasswordHash" };

    private readonly IHttpContextAccessor? _httpContextAccessor;

    // httpContextAccessor is optional so the unit tests can still create the context
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        IHttpContextAccessor? httpContextAccessor = null)
        : base(options)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public DbSet<Employee> Employees => Set<Employee>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<User> Users => Set<User>();

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Deleting a department must never delete its employees
        modelBuilder.Entity<Employee>()
            .HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Department>()
            .Property(d => d.DepartmentName)
            .HasMaxLength(100);

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.Username).HasMaxLength(100);
            entity.Property(a => a.Action).HasMaxLength(50);
            entity.Property(a => a.EntityType).HasMaxLength(50);
            entity.Property(a => a.EntityId).HasMaxLength(50);
            entity.HasIndex(a => a.Timestamp);
        });
    }

    // ---------- Automatic audit logging ----------

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        var pending = CollectAuditEntries();
        var result = base.SaveChanges(acceptAllChangesOnSuccess);

        if (pending.Count > 0)
        {
            AuditLogs.AddRange(BuildAuditLogs(pending));
            base.SaveChanges(acceptAllChangesOnSuccess);
        }

        return result;
    }

    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        var pending = CollectAuditEntries();
        var result = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);

        if (pending.Count > 0)
        {
            AuditLogs.AddRange(BuildAuditLogs(pending));
            await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        }

        return result;
    }

    private record PendingAudit(
        EntityEntry Entry,
        string Action,
        string EntityType,
        string? KeyBeforeSave,
        Dictionary<string, object?> Changes);

    private List<PendingAudit> CollectAuditEntries()
    {
        ChangeTracker.DetectChanges();

        var pending = new List<PendingAudit>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog ||
                entry.State is EntityState.Detached or EntityState.Unchanged)
            {
                continue;
            }

            var action = entry.State switch
            {
                EntityState.Added => "Create",
                EntityState.Modified => "Update",
                EntityState.Deleted => "Delete",
                _ => null
            };

            if (action == null) continue;

            var changes = new Dictionary<string, object?>();

            foreach (var property in entry.Properties)
            {
                if (property.Metadata.IsPrimaryKey()) continue;

                var name = property.Metadata.Name;
                var sensitive = SensitiveProperties.Contains(name);

                switch (entry.State)
                {
                    case EntityState.Added:
                        changes[name] = sensitive ? "[hidden]" : property.CurrentValue;
                        break;

                    case EntityState.Deleted:
                        changes[name] = sensitive ? "[hidden]" : property.OriginalValue;
                        break;

                    case EntityState.Modified:
                        if (property.IsModified && !Equals(property.OriginalValue, property.CurrentValue))
                        {
                            changes[name] = sensitive
                                ? "[changed]"
                                : new { from = property.OriginalValue, to = property.CurrentValue };
                        }
                        break;
                }
            }

            // Skip updates where nothing actually changed
            if (entry.State == EntityState.Modified && changes.Count == 0) continue;

            // New records don't have an ID until after saving
            var key = entry.State == EntityState.Added ? null : GetKey(entry);

            pending.Add(new PendingAudit(entry, action, entry.Metadata.ClrType.Name, key, changes));
        }

        return pending;
    }

    private List<AuditLog> BuildAuditLogs(List<PendingAudit> pending)
    {
        var principal = _httpContextAccessor?.HttpContext?.User;
        var userIdText = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        int? userId = int.TryParse(userIdText, out var id) ? id : null;
        var username = principal?.Identity?.Name ?? "system";

        return pending.Select(p => new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserId = userId,
            Username = username,
            Action = p.Action,
            EntityType = p.EntityType,
            EntityId = p.KeyBeforeSave ?? GetKey(p.Entry),
            Changes = JsonSerializer.Serialize(p.Changes)
        }).ToList();
    }

    private static string? GetKey(EntityEntry entry)
    {
        var key = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey());
        return key?.CurrentValue?.ToString();
    }
}