using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using TicketDeflection.Data;
using TicketDeflection.Models;

namespace TicketDeflection.Pages;

public class ComplianceModel : PageModel
{
    private readonly TicketDbContext _db;

    public ComplianceModel(TicketDbContext db)
    {
        _db = db;
    }

    public List<ComplianceScan> PendingHumanRequiredScans { get; set; } = new();
    public List<ComplianceScan> AutoBlockedScans { get; set; } = new();
    public List<ComplianceScan> RecentScans { get; set; } = new();
    public int TotalScans { get; set; }
    public int HumanRequiredCount { get; set; }
    public int AutoBlockedCount { get; set; }
    public int AdvisoryCount { get; set; }
    public int PendingDecisionCount { get; set; }

    public async Task OnGetAsync()
    {
        var decidedScanIds = await _db.ComplianceDecisions
            .AsNoTracking()
            .Select(d => d.ScanId)
            .Distinct()
            .ToHashSetAsync();

        TotalScans = await _db.ComplianceScans
            .AsNoTracking()
            .CountAsync();

        HumanRequiredCount = await _db.ComplianceScans
            .AsNoTracking()
            .CountAsync(s => s.Disposition == ComplianceDisposition.HUMAN_REQUIRED);

        AutoBlockedCount = await _db.ComplianceScans
            .AsNoTracking()
            .CountAsync(s => s.Disposition == ComplianceDisposition.AUTO_BLOCK);

        AdvisoryCount = await _db.ComplianceScans
            .AsNoTracking()
            .CountAsync(s => s.Disposition == ComplianceDisposition.ADVISORY);

        PendingHumanRequiredScans = await _db.ComplianceScans
            .AsNoTracking()
            .Include(s => s.Findings)
            .Where(s => s.Disposition == ComplianceDisposition.HUMAN_REQUIRED)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        PendingHumanRequiredScans = PendingHumanRequiredScans
            .Where(s => !decidedScanIds.Contains(s.Id))
            .ToList();

        PendingDecisionCount = PendingHumanRequiredScans.Count;

        AutoBlockedScans = await _db.ComplianceScans
            .AsNoTracking()
            .Include(s => s.Findings)
            .Where(s => s.Disposition == ComplianceDisposition.AUTO_BLOCK)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();

        RecentScans = await _db.ComplianceScans
            .AsNoTracking()
            .OrderByDescending(s => s.SubmittedAt)
            .Take(20)
            .ToListAsync();
    }
}
