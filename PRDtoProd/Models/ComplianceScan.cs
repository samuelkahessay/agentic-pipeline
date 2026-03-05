#nullable enable

namespace PRDtoProd.Models;

public class ComplianceScan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public ContentType ContentType { get; set; }
    public string? SourceLabel { get; set; }
    public ComplianceDisposition Disposition { get; set; }
    public bool IsDemo { get; set; }
    public ICollection<ComplianceFinding> Findings { get; set; } = new List<ComplianceFinding>();
}
