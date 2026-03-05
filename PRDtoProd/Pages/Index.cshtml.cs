using Microsoft.AspNetCore.Mvc.RazorPages;
using PRDtoProd.Services;

namespace PRDtoProd.Pages;

public class IndexModel : PageModel
{
    private readonly IShowcaseService _showcase;
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

    public IndexModel(IShowcaseService showcase, IDecisionLedgerService ledger)
    {
        _showcase = showcase;
        _ledger = ledger;
    }

    public int TotalRuns { get; private set; }
    public int TotalIssues { get; private set; }
    public int TotalPrs { get; private set; }
    public DecisionEvent? BoundaryStop { get; private set; }

    public async Task OnGetAsync()
    {
        var runs = await _showcase.GetCompletedRunsAsync();
        TotalRuns = runs.Count;
        TotalIssues = runs.Sum(r => r.IssueCount);
        TotalPrs = runs.Sum(r => r.PrCount);

        var decisions = await _ledger.GetDecisionsAsync();
        BoundaryStop = decisions
            .Where(d => d.Outcome == "blocked" && HardBoundaryActions.Contains(d.RequestedAction))
            .FirstOrDefault()
            ?? decisions
            .Where(d => d.Outcome == "queued_for_human" && HardBoundaryActions.Contains(d.RequestedAction))
            .FirstOrDefault();
    }
}
