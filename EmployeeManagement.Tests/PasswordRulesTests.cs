using EmployeeManagement.API.Services;

namespace EmployeeManagement.Tests;

public class PasswordRulesTests
{
    [Theory]
    [InlineData("Admin@123")]
    [InlineData("Welcome123")]
    [InlineData("Abcdefg1")]
    public void Validate_StrongPassword_ReturnsNull(string password)
    {
        Assert.Null(PasswordRules.Validate(password));
    }

    [Theory]
    [InlineData("", "at least 8")]
    [InlineData("Ab1", "at least 8")]
    [InlineData("welcome123", "uppercase")]
    [InlineData("WELCOME123", "lowercase")]
    [InlineData("WelcomeHome", "number")]
    public void Validate_WeakPassword_ReturnsMessage(string password, string expectedText)
    {
        var error = PasswordRules.Validate(password);

        Assert.NotNull(error);
        Assert.Contains(expectedText, error, StringComparison.OrdinalIgnoreCase);
    }
}
