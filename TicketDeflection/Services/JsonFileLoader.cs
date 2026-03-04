using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace TicketDeflection.Services;

/// <summary>
/// Shared JSON file-loading utilities used by services that read typed records
/// from a directory of *.json files under the drills/ tree.
/// </summary>
internal static class JsonFileLoader
{
    internal static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    /// <summary>
    /// Resolves a drills sub-directory path relative to the content root.
    /// Prefers the published output location (contentRoot/drills/{subdir})
    /// and falls back to the local dev location (contentRoot/../drills/{subdir}).
    /// </summary>
    internal static string ResolveDefaultDrillsSubdirPath(string contentRoot, string subdir)
    {
        var publishedPath = Path.GetFullPath(Path.Combine(contentRoot, "drills", subdir));
        if (Directory.Exists(publishedPath))
            return publishedPath;
        return Path.GetFullPath(Path.Combine(contentRoot, "..", "drills", subdir));
    }

    /// <summary>
    /// Enumerates all *.json files in <paramref name="path"/>, deserializing each as
    /// <typeparamref name="T"/>. Files that fail to parse are skipped with a warning.
    /// Returns an empty list if the directory does not exist.
    /// </summary>
    internal static List<T> LoadAll<T>(string path, ILogger logger, string typeName)
    {
        var results = new List<T>();

        if (!Directory.Exists(path))
        {
            logger.LogWarning("{TypeName} directory not found at {Path}", typeName, path);
            return results;
        }

        foreach (var file in Directory.EnumerateFiles(path, "*.json"))
        {
            try
            {
                var json = File.ReadAllText(file);
                var item = JsonSerializer.Deserialize<T>(json, JsonOpts);
                if (item is not null)
                    results.Add(item);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Skipping {TypeName} file {File}: failed to parse", typeName, file);
            }
        }

        return results;
    }

    internal static int CompareTimestampsDescending(string? left, string? right)
    {
        var leftParsed = ParseTimestamp(left);
        var rightParsed = ParseTimestamp(right);
        return rightParsed.CompareTo(leftParsed);
    }

    internal static DateTimeOffset ParseTimestamp(string? value)
    {
        if (value is null)
            return DateTimeOffset.MinValue;
        return DateTimeOffset.TryParse(value, out var parsed)
            ? parsed
            : DateTimeOffset.MinValue;
    }
}
