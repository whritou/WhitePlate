namespace WhitePlate.Api.Tenancy;

[AttributeUsage(AttributeTargets.Method)]
public sealed class RequireTenantBySlugAttribute : Attribute;
