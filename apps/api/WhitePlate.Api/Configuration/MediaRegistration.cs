using WhitePlate.Application.Media;
using WhitePlate.Infrastructure.Media;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Api.Configuration;

public static class MediaRegistration
{
    public static IServiceCollection AddBrandMedia(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton(new S3MediaOptions(configuration["Media:Endpoint"], configuration["Media:Region"],
            configuration["Media:Bucket"], configuration["Media:AccessKey"], configuration["Media:SecretKey"],
            configuration.GetValue("Media:ForcePathStyle", true), configuration.GetValue("Media:AllowLocalHttp", false)));
        services.AddSingleton<IMediaStorage, S3MediaStorage>();
        services.AddSingleton<IMediaImageProcessor, BrandImageProcessor>();
        services.AddScoped<IMediaRepository, MediaRepository>();
        services.AddScoped<BrandMediaService>();
        services.AddScoped<ExpiredMediaCleanup>();
        services.AddHostedService<MediaCleanupDispatcher>();
        return services;
    }
}

internal sealed class MediaCleanupDispatcher(IServiceScopeFactory scopes, ILogger<MediaCleanupDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<ExpiredMediaCleanup>().RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception exception) { logger.LogWarning("Media cleanup will retry; failure type {FailureType}", exception.GetType().Name); }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
