using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using PRDtoProd.Services;

namespace PRDtoProd.Tests;

public class JsonFileLoaderTests : IDisposable
{
    private readonly string _tempRoot;

    public JsonFileLoaderTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), $"json-file-loader-tests-{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempRoot);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
            Directory.Delete(_tempRoot, recursive: true);
    }

    // ── ResolveDefaultDrillsSubdirPath ────────────────────────────────────────

    [Fact]
    public void ResolveDefaultDrillsSubdirPath_PrefersPublishedPath_WhenDirectoryExists()
    {
        var publishedDir = Path.Combine(_tempRoot, "drills", "reports");
        Directory.CreateDirectory(publishedDir);

        var resolved = JsonFileLoader.ResolveDefaultDrillsSubdirPath(_tempRoot, "reports");

        Assert.Equal(Path.GetFullPath(publishedDir), resolved);
    }

    [Fact]
    public void ResolveDefaultDrillsSubdirPath_FallsBackToParent_WhenDirectoryAbsent()
    {
        var projectDir = Path.Combine(_tempRoot, "TicketDeflection");
        Directory.CreateDirectory(projectDir);

        var resolved = JsonFileLoader.ResolveDefaultDrillsSubdirPath(projectDir, "decisions");

        Assert.Equal(
            Path.GetFullPath(Path.Combine(_tempRoot, "drills", "decisions")),
            resolved);
    }

    // ── LoadAll ───────────────────────────────────────────────────────────────

    private sealed record SimpleRecord(string Id, string Value);

    private static readonly JsonSerializerOptions WriteOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    [Fact]
    public void LoadAll_ReturnsEmptyList_WhenDirectoryDoesNotExist()
    {
        var missing = Path.Combine(_tempRoot, "nonexistent");

        var results = JsonFileLoader.LoadAll<SimpleRecord>(
            missing, NullLogger.Instance, "simple record");

        Assert.Empty(results);
    }

    [Fact]
    public void LoadAll_DeserializesAllValidFiles()
    {
        var dir = Path.Combine(_tempRoot, "data");
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "a.json"),
            JsonSerializer.Serialize(new SimpleRecord("a", "alpha"), WriteOpts));
        File.WriteAllText(Path.Combine(dir, "b.json"),
            JsonSerializer.Serialize(new SimpleRecord("b", "beta"), WriteOpts));

        var results = JsonFileLoader.LoadAll<SimpleRecord>(
            dir, NullLogger.Instance, "simple record");

        Assert.Equal(2, results.Count);
        Assert.Contains(results, r => r.Id == "a" && r.Value == "alpha");
        Assert.Contains(results, r => r.Id == "b" && r.Value == "beta");
    }

    [Fact]
    public void LoadAll_SkipsInvalidFiles_AndReturnsValidOnes()
    {
        var dir = Path.Combine(_tempRoot, "mixed");
        Directory.CreateDirectory(dir);
        File.WriteAllText(Path.Combine(dir, "good.json"),
            JsonSerializer.Serialize(new SimpleRecord("good", "ok"), WriteOpts));
        File.WriteAllText(Path.Combine(dir, "bad.json"), "{not valid json");

        var results = JsonFileLoader.LoadAll<SimpleRecord>(
            dir, NullLogger.Instance, "simple record");

        Assert.Single(results);
        Assert.Equal("good", results[0].Id);
    }

    // ── CompareTimestampsDescending / ParseTimestamp ──────────────────────────

    [Fact]
    public void CompareTimestampsDescending_ReturnsNegative_WhenLeftIsNewer()
    {
        var cmp = JsonFileLoader.CompareTimestampsDescending(
            "2026-03-04T10:00:00Z", "2026-03-04T09:00:00Z");

        Assert.True(cmp < 0);
    }

    [Fact]
    public void CompareTimestampsDescending_ReturnsPositive_WhenRightIsNewer()
    {
        var cmp = JsonFileLoader.CompareTimestampsDescending(
            "2026-03-04T09:00:00Z", "2026-03-04T10:00:00Z");

        Assert.True(cmp > 0);
    }

    [Fact]
    public void CompareTimestampsDescending_HandlesNullValues()
    {
        // null treated as MinValue, so non-null should sort first (negative = left wins)
        var cmp = JsonFileLoader.CompareTimestampsDescending("2026-03-04T09:00:00Z", null);

        Assert.True(cmp < 0);
    }

    [Fact]
    public void ParseTimestamp_ReturnsMinValue_ForNull()
    {
        Assert.Equal(DateTimeOffset.MinValue, JsonFileLoader.ParseTimestamp(null));
    }

    [Fact]
    public void ParseTimestamp_ReturnsMinValue_ForInvalidString()
    {
        Assert.Equal(DateTimeOffset.MinValue, JsonFileLoader.ParseTimestamp("not-a-date"));
    }

    [Fact]
    public void ParseTimestamp_ParsesValidIso8601()
    {
        var result = JsonFileLoader.ParseTimestamp("2026-03-04T10:30:00Z");

        Assert.Equal(new DateTimeOffset(2026, 3, 4, 10, 30, 0, TimeSpan.Zero), result);
    }
}
