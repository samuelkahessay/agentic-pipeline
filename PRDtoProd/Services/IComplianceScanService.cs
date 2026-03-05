#nullable enable

using PRDtoProd.Data;
using PRDtoProd.Models;

namespace PRDtoProd.Services;

public interface IComplianceScanService
{
    Task<ComplianceScan> ScanAsync(string content, ContentType contentType, string? sourceLabel, TicketDbContext db);
}
