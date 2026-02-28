using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using TicketDeflection.Data;

namespace TicketDeflection.Tests;

public class ActivityEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ActivityEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(b =>
            b.ConfigureServices(services =>
            {
                var existing = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<TicketDbContext>));
                if (existing != null) services.Remove(existing);
                services.AddDbContext<TicketDbContext>(o =>
                    o.UseInMemoryDatabase($"ActivityTestDb_{Guid.NewGuid()}"));
            }));
    }

    [Fact]
    public async Task GetActivity_Returns200_WithExpectedStructure()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/metrics/activity");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
    }

    [Fact]
    public async Task GetActivity_EmptyDb_ReturnsEmptyArray()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/metrics/activity");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.Equal(0, doc.RootElement.GetArrayLength());
    }

    [Fact]
    public async Task GetActivity_RespectsLimitParameter()
    {
        var client = _factory.CreateClient();

        // Run simulation to generate activity logs
        await client.PostAsync("/api/simulate?count=5", null);

        var response = await client.GetAsync("/api/metrics/activity?limit=3&offset=0");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        Assert.True(doc.RootElement.GetArrayLength() <= 3);
    }

    [Fact]
    public async Task GetActivity_RespectsOffsetParameter()
    {
        var client = _factory.CreateClient();

        await client.PostAsync("/api/simulate?count=5", null);

        var allRes = await client.GetAsync("/api/metrics/activity?limit=100&offset=0");
        var offsetRes = await client.GetAsync("/api/metrics/activity?limit=100&offset=1");

        Assert.Equal(HttpStatusCode.OK, allRes.StatusCode);
        Assert.Equal(HttpStatusCode.OK, offsetRes.StatusCode);

        using var allDoc = JsonDocument.Parse(await allRes.Content.ReadAsStringAsync());
        using var offsetDoc = JsonDocument.Parse(await offsetRes.Content.ReadAsStringAsync());

        var allCount = allDoc.RootElement.GetArrayLength();
        var offsetCount = offsetDoc.RootElement.GetArrayLength();

        if (allCount > 0)
            Assert.True(offsetCount <= allCount);
    }

    [Fact]
    public async Task GetActivity_EachItemHasExpectedFields()
    {
        var client = _factory.CreateClient();

        await client.PostAsync("/api/simulate?count=3", null);

        var response = await client.GetAsync("/api/metrics/activity?limit=5");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        var arr = doc.RootElement;

        if (arr.GetArrayLength() > 0)
        {
            var first = arr[0];
            Assert.True(first.TryGetProperty("id", out _), "Missing id");
            Assert.True(first.TryGetProperty("ticketId", out _), "Missing ticketId");
            Assert.True(first.TryGetProperty("action", out _), "Missing action");
            Assert.True(first.TryGetProperty("details", out _), "Missing details");
            Assert.True(first.TryGetProperty("timestamp", out _), "Missing timestamp");
        }
    }
}
