using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using TicketDeflection.Services;

namespace TicketDeflection.Tests;

public class OperatorPageTests : IDisposable
{
    private readonly string _tempDir;
    private readonly string _decisionsDir;
    private readonly string _reportsDir;
    private readonly WebApplicationFactory<Program> _factory;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    public OperatorPageTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"operator-page-tests-{Guid.NewGuid():N}");
        _decisionsDir = Path.Combine(_tempDir, "decisions");
        Directory.CreateDirectory(_decisionsDir);

        _reportsDir = Path.Combine(_tempDir, "reports");
        Directory.CreateDirectory(_reportsDir);

        WriteDrillReport(new
        {
            drill_id = "20260302-152002",
            drill_type = "main_build_syntax",
            failure_signature = "cs1002-missing-semicolon",
            verdict = "PASS",
            started_at = "2026-03-02T15:20:03Z",
            completed_at = "2026-03-02T15:32:25Z",
            stages = new Dictionary<string, object>
            {
                ["ci_failure"] = new { status = "pass", timestamp = "2026-03-02T15:20:07Z", elapsed_from_previous_s = 3, sla_s = 120, url = "" },
                ["issue_created"] = new { status = "pass", timestamp = "2026-03-02T15:21:03Z", elapsed_from_previous_s = 56, sla_s = 120, url = "" },
                ["auto_dispatch"] = new { status = "pass", timestamp = "2026-03-02T15:21:33Z", elapsed_from_previous_s = 30, sla_s = 120, url = "" },
                ["repair_pr"] = new { status = "pass", timestamp = "2026-03-02T15:26:24Z", elapsed_from_previous_s = 291, sla_s = 600, url = "" },
                ["ci_green"] = new { status = "pass", timestamp = "2026-03-02T15:27:08Z", elapsed_from_previous_s = 44, sla_s = 900, url = "" },
                ["auto_merge"] = new { status = "pass", timestamp = "2026-03-02T15:30:09Z", elapsed_from_previous_s = 181, sla_s = 600, url = "" },
                ["main_recovered"] = new { status = "pass", timestamp = "2026-03-02T15:32:17Z", elapsed_from_previous_s = 128, sla_s = 300, url = "" }
            }
        });

        WriteEvent(new DecisionEvent(
            1,
            "20260302T201840Z-auto-merge-pipeline-pr-acted",
            "2026-03-02T20:18:40Z",
            new DecisionActor("workflow", "pr-review-submit"),
            "pr-review-submit",
            "auto_merge_pipeline_pr",
            new PolicyResult("autonomous", null),
            new DecisionTarget("pull_request", "284", null, "[Pipeline] PR #284"),
            ["Formal APPROVE review posted"],
            "acted",
            "Auto-merge armed after approval on PR #284.",
            null));

        WriteEvent(new DecisionEvent(
            1,
            "20260302T201905Z-workflow-file-change-blocked",
            "2026-03-02T20:19:05Z",
            new DecisionActor("workflow", "pr-review-submit"),
            "pr-review-submit",
            "workflow_file_change",
            new PolicyResult("human_required", "Workflow changes alter the control plane and can widen blast radius across the repo."),
            new DecisionTarget("file", null, ".github/workflows/auto-dispatch.yml", ".github/workflows/auto-dispatch.yml"),
            ["Workflow file touched"],
            "blocked",
            "Autonomous merge blocked because the PR touched a workflow file.",
            "repo maintainer"));

        WriteEvent(new DecisionEvent(
            1,
            "20260302T202012Z-secret-rotation-queued-for-human",
            "2026-03-02T20:20:12Z",
            new DecisionActor("service", "demo-preflight"),
            "demo-preflight",
            "secret_or_token_change",
            new PolicyResult("human_required", "Credentials and kill-switch variables govern system authority and must stay under human control."),
            new DecisionTarget("secret", null, null, "GH_AW_GITHUB_TOKEN"),
            ["Secret rotation changes system authority"],
            "queued_for_human",
            "Token rotation requires human action outside the autonomous lane.",
            "repo maintainer"));

        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DecisionLedger:Path"] = _decisionsDir,
                    ["DrillReports:Path"] = _reportsDir,
                    ["DemoSeed:Enabled"] = "false"
                }));
        });
    }

    [Fact]
    public async Task Operator_Returns200()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/operator");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Operator_RendersBlockedQueuedAndAutonomousSections()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/operator");

        Assert.Contains("Operator Queue", html);
        Assert.Contains("Human-required refusals", html);
        Assert.Contains("Waiting on an operator", html);
        Assert.Contains("Recent autonomous actions", html);
        Assert.Contains("The system stops before it can widen its own authority.", html);
    }

    [Fact]
    public async Task Operator_RendersDecisionSummaries()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/operator");

        Assert.Contains("Autonomous merge blocked because the PR touched a workflow file.", html);
        Assert.Contains("Token rotation requires human action outside the autonomous lane.", html);
        Assert.Contains("Auto-merge armed after approval on PR #284.", html);
        Assert.Contains(".github/workflows/auto-dispatch.yml", html);
        Assert.Contains("GH_AW_GITHUB_TOKEN", html);
        Assert.Contains("human-owned control plane", html);
        Assert.Contains("Workflow changes alter the control plane and can widen blast radius across the repo.", html);
    }

    [Fact]
    public async Task Operator_RendersPastRunsSection()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/operator");

        Assert.Contains("Past Runs", html);
        Assert.Contains("20260302-152002", html);
        Assert.Contains("PASS", html);
        Assert.Contains("main_build_syntax", html);
        Assert.Contains("cs1002-missing-semicolon", html);
        Assert.Contains("7/7 stages", html);
        Assert.Contains("decision trail", html);
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (Directory.Exists(_tempDir))
        {
            Directory.Delete(_tempDir, recursive: true);
        }
    }

    private void WriteEvent(DecisionEvent evt)
    {
        var json = JsonSerializer.Serialize(evt, JsonOpts);
        File.WriteAllText(Path.Combine(_decisionsDir, $"{evt.EventId}.json"), json);
    }

    private void WriteDrillReport(object report)
    {
        var json = JsonSerializer.Serialize(report, JsonOpts);
        File.WriteAllText(Path.Combine(_reportsDir, $"test-drill-{Guid.NewGuid():N}.json"), json);
    }
}
