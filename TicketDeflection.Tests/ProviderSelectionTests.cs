using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using TicketDeflection.Data;

namespace TicketDeflection.Tests;

public class ProviderSelectionTests
{
    [Fact]
    public void DefaultProvider_UsesSqlite()
    {
        // The default factory (no overrides) should use SQLite
        using var factory = new WebApplicationFactory<Program>();
        using var scope = factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<TicketDbContext>();

        Assert.True(context.Database.IsSqlite());
    }

    [Fact]
    public void SqlServerProvider_WithoutConnectionString_ThrowsOnStartup()
    {
        Assert.Throws<InvalidOperationException>(() =>
        {
            using var factory = new WebApplicationFactory<Program>()
                .WithWebHostBuilder(b =>
                {
                    b.UseSetting("Database:Provider", "SqlServer");
                });
            // Force host startup
            using var client = factory.CreateClient();
        });
    }
}
