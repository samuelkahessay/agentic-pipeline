using Microsoft.AspNetCore.Mvc.RazorPages;
using TicketDeflection.Services;

namespace TicketDeflection.Pages;

public class OperatorModel : PageModel
{
    private readonly IDecisionLedgerService _ledger;
    private readonly IDrillReportService _drills;
    private static readonly string[] HardBoundaryActions =
    [
        "workflow_file_change",
        "policy_artifact_change",
        "merge_scope_expansion",
        "deploy_policy_change",
        "branch_protection_change",
        "secret_or_token_change"
    ];

    public OperatorModel(IDecisionLedgerService ledger, IDrillReportService drills)
    {
        _ledger = ledger;
        _drills = drills;
    }

    public DecisionQueue Queue { get; private set; } = new([], [], []);
    public DecisionMetrics Metrics { get; private set; } = new(0, 0, 0, 0, 0, null);
    public IReadOnlyList<DecisionEvent> Decisions { get; private set; } = [];
    public DecisionEvent? FeaturedBoundaryStop { get; private set; }
    public IReadOnlyList<DrillReport> DrillRuns { get; private set; } = [];

    public async Task OnGetAsync()
    {
        var all = await _ledger.GetDecisionsAsync();
        Decisions = all.Take(6).ToList();

        var blocked = all.Where(e => e.Outcome == "blocked").ToList();
        var queuedForHuman = all.Where(e => e.Outcome == "queued_for_human").ToList();
        var recentAutonomous = all
            .Where(e => e.Outcome == "acted" && e.PolicyResult.Mode == "autonomous")
            .ToList();
        Queue = new DecisionQueue(blocked, queuedForHuman, recentAutonomous);

        var autonomousActed = all.Count(e => e.Outcome == "acted" && e.PolicyResult.Mode == "autonomous");
        var escalated = all.Count(e => e.Outcome == "escalated");
        string? lastUpdatedUtc = all.Count > 0 ? all[0].Timestamp : null;
        Metrics = new DecisionMetrics(all.Count, autonomousActed, blocked.Count, queuedForHuman.Count, escalated, lastUpdatedUtc);

        FeaturedBoundaryStop = Queue.Blocked.FirstOrDefault(IsHardBoundaryStop)
            ?? Queue.QueuedForHuman.FirstOrDefault(IsHardBoundaryStop);

        DrillRuns = (await _drills.GetReportsAsync())
            .Where(r => r.Verdict != "pending")
            .Take(10)
            .ToList();
    }

    private static bool IsHardBoundaryStop(DecisionEvent decision)
    {
        return HardBoundaryActions.Contains(decision.RequestedAction, StringComparer.Ordinal);
    }
}
