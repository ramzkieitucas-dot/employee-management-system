using EmployeeManagement.API.Services;

namespace EmployeeManagement.Tests;

public class EmployeeCodeGeneratorTests
{
    [Fact]
    public void Next_WhenNoEmployees_ReturnsEmp001()
    {
        Assert.Equal("EMP001", EmployeeCodeGenerator.Next(Array.Empty<string>()));
    }

    [Fact]
    public void Next_ReturnsOneAfterHighestCode()
    {
        var codes = new[] { "EMP001", "EMP007", "EMP003" };

        Assert.Equal("EMP008", EmployeeCodeGenerator.Next(codes));
    }

    [Fact]
    public void Next_IgnoresCodesThatAreNotNumbers()
    {
        var codes = new[] { "EMP002", "EMPXYZ", "ABC999", "" };

        Assert.Equal("EMP003", EmployeeCodeGenerator.Next(codes));
    }

    [Fact]
    public void Next_HandlesOldUnpaddedCodes()
    {
        // e.g. the old "EMP2" record from before validation
        var codes = new[] { "EMP2", "EMP001" };

        Assert.Equal("EMP003", EmployeeCodeGenerator.Next(codes));
    }

    [Fact]
    public void Next_GoesPast999()
    {
        Assert.Equal("EMP1000", EmployeeCodeGenerator.Next(new[] { "EMP999" }));
    }
}
