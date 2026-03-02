using Microsoft.AspNetCore.Mvc.RazorPages;
using TicketDeflection.Services;

namespace TicketDeflection.Pages;

public class OperatorModel : PageModel
{
    private readonly IDecisionLedgerService _ledger;
    private static readonly string[] HardBoundaryActions =
    [
        "workflow_file_change",
        "policy_artifact_change",
        "merge_scope_expansion",
        "deploy_policy_change",
        "branch_protection_change",
        "secret_or_token_change"
    ];

    public OperatorModel(IDecisionLedgerService ledger)
    {
        _ledger = ledger;
    }

    public DecisionQueue Queue { get; private set; } = new([], [], []);
    public DecisionMetrics Metrics { get; private set; } = new(0, 0, 0, 0, 0, null);
    public IReadOnlyList<DecisionEvent> Decisions { get; private set; } = [];
    public DecisionEvent? FeaturedBoundaryStop { get; private set; }

    public async Task OnGetAsync()
    {
        Queue = await _ledger.GetQueueAsync();
        Metrics = await _ledger.GetMetricsAsync();
        Decisions = (await _ledger.GetDecisionsAsync()).Take(6).ToList();
        FeaturedBoundaryStop = Queue.Blocked.FirstOrDefault(IsHardBoundaryStop)
            ?? Queue.QueuedForHuman.FirstOrDefault(IsHardBoundaryStop);
    }

    private static bool IsHardBoundaryStop(DecisionEvent decision)
    {
        return HardBoundaryActions.Contains(decision.RequestedAction, StringComparer.Ordinal);
    }
}
