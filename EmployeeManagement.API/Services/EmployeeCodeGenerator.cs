namespace EmployeeManagement.API.Services;

// Pure logic (no database), so it's easy to unit test
public static class EmployeeCodeGenerator
{
    public const string Prefix = "EMP";

    // Returns the next code after the highest existing "EMP###" code
    public static string Next(IEnumerable<string> existingCodes)
    {
        var lastNumber = existingCodes
            .Where(code => !string.IsNullOrEmpty(code) && code.StartsWith(Prefix))
            .Select(code => int.TryParse(code.Substring(Prefix.Length), out var number) ? number : 0)
            .DefaultIfEmpty(0)
            .Max();

        return $"{Prefix}{lastNumber + 1:D3}";
    }
}
