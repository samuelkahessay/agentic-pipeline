using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using TicketDeflection.Data;
using TicketDeflection.Models;

namespace TicketDeflection.Tests;

public class CompliancePageTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public CompliancePageTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CompliancePage_Returns200()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/compliance");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task CompliancePage_RendersRefreshHealthIndicator_AndNoTemplateComments()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/compliance");

        Assert.Contains("id=\"refresh-status\"", html);
        Assert.Contains("live refresh connected", html);
        Assert.Contains("live refresh degraded", html);
        Assert.Contains("setRefreshError", html);
        Assert.DoesNotContain("catch (_) {}", html);
        Assert.DoesNotContain("{{!--", html);
    }

    [Fact]
    public async Task CompliancePage_ServerRenderedMetrics_UseFullScanCount()
    {
        var dbName = $"CompliancePageTestDb_{Guid.NewGuid()}";
        await using var factory = _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                var existing = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<TicketDbContext>));
                if (existing != null) services.Remove(existing);
                services.AddDbContext<TicketDbContext>(options => options.UseInMemoryDatabase(dbName));
            }));

        var client = factory.CreateClient();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TicketDbContext>();
            db.ComplianceScans.AddRange(Enumerable.Range(0, 55).Select(i => new ComplianceScan
            {
                ContentType = ContentType.LOG,
                SourceLabel = $"bulk-{i}",
                Disposition = ComplianceDisposition.ADVISORY,
                IsDemo = false,
                SubmittedAt = DateTimeOffset.UtcNow.AddMinutes(i)
            }));
            db.SaveChanges();
        }

        var html = await client.GetStringAsync("/compliance");

        Assert.Equal("60", ExtractElementTextById(html, "m-total"));
    }

    private static string ExtractElementTextById(string html, string elementId)
    {
        var match = Regex.Match(
            html,
            $@"id=""{Regex.Escape(elementId)}""[^>]*>([^<]+)<",
            RegexOptions.IgnoreCase);

        Assert.True(match.Success, $"Could not find element with id '{elementId}'.");
        return match.Groups[1].Value.Trim();
    }
}
