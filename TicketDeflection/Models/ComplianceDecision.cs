#nullable enable

namespace TicketDeflection.Models;

public class ComplianceDecision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ScanId { get; set; }
    public string OperatorId { get; set; } = string.Empty;
    public string Decision { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTimeOffset DecidedAt { get; set; } = DateTimeOffset.UtcNow;
    public ComplianceScan? Scan { get; set; }
}
