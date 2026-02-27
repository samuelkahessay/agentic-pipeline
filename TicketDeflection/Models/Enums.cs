namespace TicketDeflection.Models;

public enum TicketCategory
{
    Bug,
    FeatureRequest,
    HowTo,
    AccountIssue,
    Other
}

public enum TicketSeverity
{
    Low,
    Medium,
    High,
    Critical
}

public enum TicketStatus
{
    New,
    Classified,
    Matched,
    AutoResolved,
    Escalated
}
