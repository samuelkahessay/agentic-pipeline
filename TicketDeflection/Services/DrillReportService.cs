using Microsoft.Extensions.Logging;

namespace TicketDeflection.Services;

public sealed class DrillReportService : IDrillReportService
{
    private readonly string _reportsPath;
    private readonly ILogger<DrillReportService> _logger;

    public DrillReportService(
        IConfiguration configuration,
        IWebHostEnvironment env,
        ILogger<DrillReportService> logger)
    {
        _logger = logger;
        var configured = configuration["DrillReports:Path"];
        _reportsPath = !string.IsNullOrEmpty(configured)
            ? configured
            : ResolveDefaultReportsPath(env.ContentRootPath);
    }

    /// <summary>
    /// Resolves the reports directory relative to the content root.
    /// In local dev, ContentRootPath is TicketDeflection/, so drills/reports/
    /// is at ../drills/reports/. In published output, it would be at
    /// drills/reports/ directly under the content root.
    /// </summary>
    internal static string ResolveDefaultReportsPath(string contentRoot) =>
        JsonFileLoader.ResolveDefaultDrillsSubdirPath(contentRoot, "reports");

    public Task<IReadOnlyList<DrillReport>> GetReportsAsync()
    {
        var reports = JsonFileLoader.LoadAll<DrillReport>(_reportsPath, _logger, "drill report");
        reports.Sort((a, b) => JsonFileLoader.CompareTimestampsDescending(a.StartedAt, b.StartedAt));
        return Task.FromResult<IReadOnlyList<DrillReport>>(reports);
    }
}
