using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PRDtoProd.Data;
using PRDtoProd.Models;
using PRDtoProd.Services;

namespace PRDtoProd.Tests;

public class MatchingServiceTests
{
    private static TicketDbContext CreateContext()
    {
        var opts = new DbContextOptionsBuilder<TicketDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TicketDbContext(opts);
    }

    private static MatchingService CreateService(double threshold = 0.3)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MatchingThreshold"] = threshold.ToString()
            })
            .Build();
        return new MatchingService(config);
    }

    private static void SeedPasswordArticle(TicketDbContext context)
    {
        context.KnowledgeArticles.Add(new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Password Reset Guide",
            Content = "Click Forgot Password on the login page, enter your email, and follow the reset link sent to your inbox.",
            Tags = "password,reset,login,email,account",
            Category = TicketCategory.AccountIssue
        });
        context.SaveChanges();
    }

    [Fact]
    public void PasswordResetTicket_AgainstSeedData_AutoResolved()
    {
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "I forgot my password",
            Description = "I cannot login and need to reset my password via email",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.AutoResolved, ticket.Status);
        Assert.NotNull(ticket.Resolution);
        Assert.Contains("Password", ticket.Resolution);
    }

    [Fact]
    public void GibberishTicket_NoMatch_Escalated()
    {
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "zxqvbnm asdfgh",
            Description = "qwerty uiop lkjhgfds",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.Escalated, ticket.Status);
    }

    [Fact]
    public void EmptyKnowledgeBase_Escalated()
    {
        using var context = CreateContext();

        var ticket = new Ticket
        {
            Title = "Any ticket",
            Description = "Some description",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.Escalated, ticket.Status);
    }

    [Fact]
    public void ShortTicket_ForgotPassword_AutoResolved()
    {
        // 2-word ticket whose both words appear in the article → coverage = 100%
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "forgot password",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.AutoResolved, ticket.Status);
        Assert.NotNull(ticket.Resolution);
        Assert.Contains("Password", ticket.Resolution);
    }

    [Fact]
    public void ShortTicket_CantLogin_AutoResolved()
    {
        // "login" appears in both article content and tags → coverage ≥ 0.5
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "can't login",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.AutoResolved, ticket.Status);
    }

    [Fact]
    public void LongTicket_ManyMatchingWords_AutoResolved()
    {
        // Long tickets still match correctly after the asymmetric change
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "Need help with account login and password reset",
            Description = "I cannot access my account and need to reset my password via the email link",
            Status = TicketStatus.New
        };

        var service = CreateService();
        service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.AutoResolved, ticket.Status);
        Assert.Contains("Password", ticket.Resolution!);
    }

    [Fact]
    public void ResolveTicket_AutoResolved_ReturnedScoreAboveThreshold()
    {
        // The returned score must be consistent with the resolution decision (>= threshold)
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "forgot password",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService(threshold: 0.3);
        var (score, article) = service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.AutoResolved, ticket.Status);
        Assert.True(score >= 0.3, $"Expected score >= 0.3 for auto-resolved ticket, got {score}");
        Assert.NotNull(article);
    }

    [Fact]
    public void ResolveTicket_Escalated_ReturnedScoreBelowThreshold()
    {
        // Escalated tickets must have a score that is below the threshold
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "zxqvbnm asdfgh",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService(threshold: 0.3);
        var (score, _) = service.ResolveTicket(ticket, context);

        Assert.Equal(TicketStatus.Escalated, ticket.Status);
        Assert.True(score < 0.3, $"Expected score < 0.3 for escalated ticket, got {score}");
    }

    [Fact]
    public void GetTopMatches_MatchingTicket_ReturnsNonEmptyList()
    {
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "forgot password",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService();
        var articles = context.KnowledgeArticles.ToList();
        var matches = service.GetTopMatches(ticket, articles);

        Assert.NotEmpty(matches);
        Assert.True(matches[0].Score > 0);
        Assert.Contains("Password", matches[0].Title);
    }

    [Fact]
    public void GetTopMatches_NoMatchingTicket_ReturnsEmptyList()
    {
        using var context = CreateContext();
        SeedPasswordArticle(context);

        var ticket = new Ticket
        {
            Title = "zxqvbnm asdfgh",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService();
        var articles = context.KnowledgeArticles.ToList();
        var matches = service.GetTopMatches(ticket, articles);

        Assert.Empty(matches);
    }

    [Fact]
    public void GetTopMatches_RespectsTopNLimit()
    {
        using var context = CreateContext();
        // Seed multiple articles
        for (int i = 0; i < 5; i++)
        {
            context.KnowledgeArticles.Add(new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = $"Password Article {i}",
                Content = "reset password login email account forgot",
                Tags = "password,reset,login",
                Category = TicketCategory.AccountIssue
            });
        }
        context.SaveChanges();

        var ticket = new Ticket
        {
            Title = "reset password login",
            Description = "forgot account email",
            Status = TicketStatus.New
        };

        var service = CreateService();
        var articles = context.KnowledgeArticles.ToList();
        var matches = service.GetTopMatches(ticket, articles, topN: 2);

        Assert.Equal(2, matches.Count);
    }

    [Fact]
    public void GetTopMatches_ResultsOrderedByScoreDescending()
    {
        using var context = CreateContext();
        context.KnowledgeArticles.Add(new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Strong Match",
            Content = "forgot password login email account reset",
            Tags = "password,login,reset,email,account,forgot",
            Category = TicketCategory.AccountIssue
        });
        context.KnowledgeArticles.Add(new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Weak Match",
            Content = "password",
            Tags = "password",
            Category = TicketCategory.AccountIssue
        });
        context.SaveChanges();

        var ticket = new Ticket
        {
            Title = "forgot password login email account reset",
            Description = "",
            Status = TicketStatus.New
        };

        var service = CreateService();
        var articles = context.KnowledgeArticles.ToList();
        var matches = service.GetTopMatches(ticket, articles);

        Assert.Equal(2, matches.Count);
        Assert.True(matches[0].Score >= matches[1].Score);
    }
}
