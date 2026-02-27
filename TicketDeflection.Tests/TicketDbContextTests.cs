using Microsoft.EntityFrameworkCore;
using TicketDeflection.Data;
using TicketDeflection.Models;

namespace TicketDeflection.Tests;

public class TicketDbContextTests
{
    private static TicketDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<TicketDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);

    [Fact]
    public async Task CanPersistAndRetrieveTicket()
    {
        using var context = CreateContext();
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            Title = "Login fails with 500",
            Description = "Users cannot login",
            Category = TicketCategory.Bug,
            Severity = TicketSeverity.High,
            Status = TicketStatus.New,
            Source = "api",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var retrieved = await context.Tickets.FindAsync(ticket.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(ticket.Title, retrieved.Title);
        Assert.Equal(ticket.Description, retrieved.Description);
        Assert.Equal(ticket.Category, retrieved.Category);
        Assert.Equal(ticket.Severity, retrieved.Severity);
        Assert.Equal(ticket.Status, retrieved.Status);
        Assert.Equal(ticket.Source, retrieved.Source);
        Assert.Null(retrieved.Resolution);
    }

    [Fact]
    public async Task CanPersistAndRetrieveKnowledgeArticle()
    {
        using var context = CreateContext();
        var article = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Common Error Codes",
            Content = "Error 500 means internal server error.",
            Tags = "error,500,server",
            Category = TicketCategory.Bug
        };

        context.KnowledgeArticles.Add(article);
        await context.SaveChangesAsync();

        var retrieved = await context.KnowledgeArticles.FindAsync(article.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(article.Title, retrieved.Title);
        Assert.Equal(article.Tags, retrieved.Tags);
        Assert.Equal(article.Category, retrieved.Category);
    }

    [Fact]
    public async Task CanPersistAndRetrieveActivityLog()
    {
        using var context = CreateContext();
        var ticketId = Guid.NewGuid();
        var log = new ActivityLog
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            Action = "Classified",
            Details = "Ticket classified as Bug",
            Timestamp = DateTime.UtcNow
        };

        context.ActivityLogs.Add(log);
        await context.SaveChangesAsync();

        var retrieved = await context.ActivityLogs.FindAsync(log.Id);
        Assert.NotNull(retrieved);
        Assert.Equal(ticketId, retrieved.TicketId);
        Assert.Equal(log.Action, retrieved.Action);
        Assert.Equal(log.Details, retrieved.Details);
    }

    [Fact]
    public async Task EachTestUsesIsolatedDatabase()
    {
        using var context1 = CreateContext();
        using var context2 = CreateContext();

        context1.Tickets.Add(new Ticket { Title = "Test ticket", Source = "test" });
        await context1.SaveChangesAsync();

        var count = await context2.Tickets.CountAsync();
        Assert.Equal(0, count);
    }
}
