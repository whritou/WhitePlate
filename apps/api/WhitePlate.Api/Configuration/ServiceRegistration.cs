using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Api.Identity;
using WhitePlate.Application.Identity;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Tenants;
using WhitePlate.Application.Organizations;
using WhitePlate.Application.Staff;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Orders;
using WhitePlate.Api.Realtime;
using WhitePlate.Api.OpenApi;

namespace WhitePlate.Api.Configuration;

public static class ServiceRegistration
{
    public static IServiceCollection AddWhitePlate(this IServiceCollection services, IConfiguration configuration, bool requireAuthenticationConfiguration = false)
    {
        var issuer = configuration["Authentication:Issuer"];
        var audience = configuration["Authentication:Audience"];
        if (requireAuthenticationConfiguration &&
            (!Uri.TryCreate(issuer, UriKind.Absolute, out var productionIssuer) ||
             productionIssuer.Scheme != Uri.UriSchemeHttps || string.IsNullOrWhiteSpace(audience)))
            throw new InvalidOperationException("Production requires an HTTPS Authentication:Issuer and Authentication:Audience.");

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentIdentity, HttpCurrentIdentity>();
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
        {
            if (Uri.TryCreate(issuer, UriKind.Absolute, out var issuerUri) &&
                (issuerUri.Scheme is "https" or "http") && !string.IsNullOrWhiteSpace(audience))
            {
                options.MetadataAddress = $"{issuer!.TrimEnd('/')}/.well-known/openid-configuration";
                options.RequireHttpsMetadata = issuerUri.Scheme == Uri.UriSchemeHttps;
                options.TokenValidationParameters.ValidIssuer = issuer;
                options.TokenValidationParameters.ValidAudience = audience;
            }
            options.MapInboundClaims = false;
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var token = context.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token) && context.HttpContext.Request.Path.StartsWithSegments("/hubs/orders"))
                        context.Token = token;
                    return Task.CompletedTask;
                }
            };
        });
        services.AddAuthorization();
        services.AddSingleton(provider =>
        {
            var settings = provider.GetRequiredService<IConfiguration>();
            var permitLimit = Math.Max(1, settings.GetValue<int?>("CheckoutRateLimit:PermitLimit") ?? 10);
            var windowSeconds = Math.Max(1, settings.GetValue<int?>("CheckoutRateLimit:WindowSeconds") ?? 60);
            var queueLimit = Math.Max(0, settings.GetValue<int?>("CheckoutRateLimit:QueueLimit") ?? 0);
            return new CheckoutRequestRateLimiter(permitLimit, TimeSpan.FromSeconds(windowSeconds), queueLimit);
        });
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        services.AddCors(options => options.AddPolicy("Browser", policy =>
        {
            if (allowedOrigins.Length > 0)
                policy.WithOrigins(allowedOrigins).WithMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                    .WithHeaders("Authorization", "Content-Type", "If-Match", "Idempotency-Key", "X-Requested-With",
                        "X-SignalR-User-Agent").AllowCredentials();
        }));
        services.AddOptions<TenantHostOptions>().Bind(configuration.GetSection("Tenancy"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.BaseDomain) &&
                Uri.CheckHostName(options.BaseDomain) == UriHostNameType.Dns,
                "Tenancy:BaseDomain must be a DNS hostname without a scheme or port.")
            .ValidateOnStart();
        services.AddSingleton<TenantHostResolver>();
        services.AddScoped<CurrentTenant>();
        services.AddScoped<ICurrentTenant>(provider => provider.GetRequiredService<CurrentTenant>());
        services.AddDbContext<WhitePlateDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("WhitePlate")));
        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<CreateOrderCommandHandler>();
        services.AddScoped<ListOrdersQueryHandler>();
        services.AddScoped<UpdateOrderStatusCommandHandler>();
        services.AddScoped<KitchenSubscriptionAccess>();
        services.AddScoped<IOutboxStore, OutboxStore>();
        services.AddScoped<IOrderEventPublisher, SignalRKitchenEventPublisher>();
        services.AddSignalR();
        services.AddHostedService<OrderOutboxDispatcher>();
        services.AddScoped<GetMenuQueryHandler>();
        services.AddScoped<CreateCategoryCommandHandler>();
        services.AddScoped<CreateProductCommandHandler>();
        services.AddScoped<CreateOptionGroupCommandHandler>();
        services.AddScoped<CreateOptionCommandHandler>();
        services.AddScoped<CreateDiscountCommandHandler>();
        services.AddScoped<CatalogManagementCommandHandler>();
        services.AddScoped<GetManagementCatalogQueryHandler>();
        services.AddScoped<MenuLanguageSettingsHandler>();
        services.AddScoped<CreateProductCommandHandler>();
        services.AddScoped<IStaffMembershipRepository, StaffMembershipRepository>();
        services.AddScoped<IStaffDirectoryRepository, StaffDirectoryRepository>();
        services.AddScoped<GetCurrentUserQueryHandler>();
        services.AddScoped<IOrganizationProvisioningRepository, OrganizationProvisioningRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationProvisioningRepository>();
        services.AddScoped<ProvisionOrganizationCommandHandler>();
        services.AddScoped<RenameOrganizationCommandHandler>();
        services.AddScoped<CreateOrganizationCommandHandler>();
        services.AddScoped<IStaffInvitationRepository, StaffInvitationRepository>();
        services.AddScoped<CreateStaffInvitationCommandHandler>();
        services.AddScoped<RevokeStaffInvitationCommandHandler>();
        services.AddScoped<AcceptStaffInvitationCommandHandler>();
        services.AddScoped<CreateTenantCommandHandler>();
        services.AddScoped<CreateRestaurantCommandHandler>();
        services.AddScoped<ResolveTenantQueryHandler>();
        services.AddSingleton<ApiErrorMapper>();
        services.AddExceptionHandler<ApiExceptionHandler>();
        services.AddProblemDetails();
        services.AddControllers().ConfigureApiBehaviorOptions(options =>
        {
            // Keep MVC from producing a competing default ProblemDetails response.
            options.SuppressMapClientErrors = true;
            options.InvalidModelStateResponseFactory = context =>
            {
                var mapper = context.HttpContext.RequestServices.GetRequiredService<ApiErrorMapper>();
                // Binding error messages can echo input. Return a fixed message without rejected values.
                // JSON paths can also contain arbitrary user-provided property names.
                ValidationIssue[] issues = [new("request", "invalid_value", "The supplied request is invalid.")];
                return mapper.ToActionResult(mapper.Create(context.HttpContext,
                    new ApplicationError(ErrorCode.ValidationFailed, issues)));
            };
        });
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer<SameOriginServerDocumentTransformer>();
            options.AddDocumentTransformer<BearerSecuritySchemeDocumentTransformer>();
            options.AddOperationTransformer<AuthenticationRequirementOperationTransformer>();
        });
        services.AddSingleton(TimeProvider.System);
        return services;
    }
}
