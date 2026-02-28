using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;

namespace TicketDeflection.Tests;

public class LandingPageTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public LandingPageTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task LandingPage_Returns200()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task LandingPage_ContainsServiceName()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.Contains("Ticket Deflection Service", html);
    }

    [Fact]
    public async Task LandingPage_ContainsPipelineFlow()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.Contains("Intake", html);
        Assert.Contains("Classify", html);
        Assert.Contains("Match", html);
        Assert.Contains("Resolve/Escalate", html);
    }

    [Fact]
    public async Task LandingPage_ContainsDashboardLink()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.Contains("href=\"/dashboard\"", html);
    }

    [Fact]
    public async Task LandingPage_DoesNotContainActivityLink()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.DoesNotContain("href=\"/activity\"", html);
    }

    [Fact]
    public async Task LandingPage_DoesNotContainTicketsLink()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.DoesNotContain("href=\"/tickets\"", html);
    }

    [Fact]
    public async Task LandingPage_ContainsRunDemoButton()
    {
        var client = _factory.CreateClient();
        var html = await client.GetStringAsync("/");
        Assert.Contains("Run Demo", html);
    }
}
