using TicketDeflection.Models;
using TicketDeflection.Services;

namespace TicketDeflection.Tests;

public class ClassificationServiceTests
{
    private readonly ClassificationService _service = new();

    [Fact]
    public void Classify_CrashInTitle_ReturnsBugHigh()
    {
        var ticket = new Ticket { Title = "App crash on login", Description = "" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.Bug, ticket.Category);
        Assert.Equal(TicketSeverity.High, ticket.Severity);
        Assert.Equal(TicketStatus.Classified, ticket.Status);
    }

    [Fact]
    public void Classify_HowDoIInDescription_ReturnsHowToLow()
    {
        var ticket = new Ticket { Title = "Help needed", Description = "How do I export data?" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.HowTo, ticket.Category);
        Assert.Equal(TicketSeverity.Low, ticket.Severity);
        Assert.Equal(TicketStatus.Classified, ticket.Status);
    }

    [Fact]
    public void Classify_NoMatchingKeywords_ReturnsOtherMedium()
    {
        var ticket = new Ticket { Title = "Something happened", Description = "Not sure what." };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.Other, ticket.Category);
        Assert.Equal(TicketSeverity.Medium, ticket.Severity);
        Assert.Equal(TicketStatus.Classified, ticket.Status);
    }

    [Fact]
    public void Classify_ErrorKeyword_ReturnsBugHigh()
    {
        var ticket = new Ticket { Title = "404 error on homepage", Description = "" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.Bug, ticket.Category);
        Assert.Equal(TicketSeverity.High, ticket.Severity);
    }

    [Fact]
    public void Classify_AccountKeyword_ReturnsAccountIssueMedium()
    {
        var ticket = new Ticket { Title = "Cannot login to my account", Description = "" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.AccountIssue, ticket.Category);
        Assert.Equal(TicketSeverity.Medium, ticket.Severity);
    }

    [Fact]
    public void Classify_FeatureRequestKeyword_ReturnsFeatureRequestMedium()
    {
        var ticket = new Ticket { Title = "Feature request: dark mode", Description = "Would be nice to have" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.FeatureRequest, ticket.Category);
        Assert.Equal(TicketSeverity.Medium, ticket.Severity);
    }

    [Fact]
    public void Classify_CaseInsensitive_MatchesKeyword()
    {
        var ticket = new Ticket { Title = "CRASH in production", Description = "" };
        _service.ClassifyTicket(ticket);
        Assert.Equal(TicketCategory.Bug, ticket.Category);
    }
}
