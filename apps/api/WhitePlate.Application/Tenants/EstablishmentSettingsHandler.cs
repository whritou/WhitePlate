using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed class EstablishmentSettingsHandler(IStaffMembershipRepository memberships,
    IEstablishmentSettingsRepository repository, IEstablishmentOptions options)
{
    public async Task<Result<EstablishmentSettingsDto>> GetAsync(Guid id, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct)) return Missing();
        var tenant = await repository.GetAsync(id, ct);
        return tenant is null ? Missing() : Result<EstablishmentSettingsDto>.Success(EstablishmentSettingsDto.FromTenant(tenant));
    }

    public async Task<Result<EstablishmentOptionsDto>> GetOptionsAsync(Guid id, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct) || await repository.GetAsync(id, ct) is null)
            return Result<EstablishmentOptionsDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        return Result<EstablishmentOptionsDto>.Success(options.Get());
    }

    public async Task<Result<TenantLegalProfileDto>> GetLegalProfileAsync(Guid id, ExternalIdentity identity,
        CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct))
            return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var tenant = await repository.GetAsync(id, ct);
        if (tenant is null) return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var organization = await repository.GetOrganizationAsync(tenant.OrganizationId, ct);
        return Result<TenantLegalProfileDto>.Success(TenantLegalProfileDto.From(tenant, organization));
    }

    public async Task<Result<TenantLegalProfileDto>> SaveLegalProfileAsync(Guid id, ExternalIdentity identity,
        UpdateTenantLegalProfileInput input, int? expectedVersion, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct))
            return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var tenant = await repository.GetAsync(id, ct);
        if (tenant is null) return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (expectedVersion is null) return InvalidLegal("legalProfileVersion");
        if (tenant.LegalProfileVersion != expectedVersion)
            return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
        try
        {
            if (input.Mode == "inherit") tenant.InheritLegalProfile();
            else if (input.Mode == "custom") tenant.SetCustomLegalProfile(input.CountryCode, input.Name,
                input.RegistrationNumber, input.TaxIdentifier);
            else return InvalidLegal("mode");
            if (!await repository.SaveLegalProfileAsync(tenant, identity, expectedVersion.Value, ct))
                return await CatalogAccess.CanManageAsync(memberships, id, identity, ct)
                    ? Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed))
                    : Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.NotFound));
            var organization = await repository.GetOrganizationAsync(tenant.OrganizationId, ct);
            return Result<TenantLegalProfileDto>.Success(TenantLegalProfileDto.From(tenant, organization));
        }
        catch (DomainRuleException exception)
        {
            return Result<TenantLegalProfileDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    public async Task<Result<EstablishmentSettingsDto>> SaveAsync(Guid id, ExternalIdentity identity,
        EstablishmentInput input, int? expectedVersion, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct)) return Missing();
        var tenant = await repository.GetAsync(id, ct);
        if (tenant is null) return Missing();
        if (expectedVersion is null) return Invalid("establishmentVersion");
        if (tenant.EstablishmentVersion != expectedVersion) return Conflict();
        var catalog = options.Get();
        if (!catalog.TimeZones.Contains(input.TimeZone?.Trim(), StringComparer.Ordinal)) return Invalid("timeZone");
        if (!string.IsNullOrWhiteSpace(input.CountryCode) &&
            !catalog.Countries.Contains(input.CountryCode.Trim().ToUpperInvariant(), StringComparer.Ordinal)) return Invalid("countryCode");
        var locales = tenant.MenuLocalesJson;
        var defaultLocale = tenant.DefaultMenuLocale;
        try
        {
            tenant.UpdateEstablishment(input);
            if (!await repository.SaveAsync(tenant, identity, expectedVersion.Value, locales, defaultLocale, ct))
                return await CatalogAccess.CanManageAsync(memberships, id, identity, ct) ? Conflict() : Missing();
            return Result<EstablishmentSettingsDto>.Success(EstablishmentSettingsDto.FromTenant(tenant));
        }
        catch (DomainRuleException exception)
        {
            return Result<EstablishmentSettingsDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    public async Task<Result<EstablishmentSettingsDto>> SaveOpeningHoursAsync(Guid id, ExternalIdentity identity,
        OpeningHoursSchedule? schedule, int? expectedVersion, bool clear, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, id, identity, ct)) return Missing();
        var tenant = await repository.GetAsync(id, ct);
        if (tenant is null) return Missing();
        if (expectedVersion is null) return Invalid("establishmentVersion");
        if (tenant.EstablishmentVersion != expectedVersion) return Conflict();
        try
        {
            if (clear) tenant.ClearOpeningHours(); else if (schedule is not null) tenant.SetOpeningHours(schedule);
            else return Invalid("openingHours");
            if (!await repository.SaveAsync(tenant, identity, expectedVersion.Value, tenant.MenuLocalesJson, tenant.DefaultMenuLocale, ct))
                return await CatalogAccess.CanManageAsync(memberships, id, identity, ct) ? Conflict() : Missing();
            return Result<EstablishmentSettingsDto>.Success(EstablishmentSettingsDto.FromTenant(tenant));
        }
        catch (DomainRuleException exception)
        {
            return Result<EstablishmentSettingsDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    private static Result<EstablishmentSettingsDto> Missing() => Result<EstablishmentSettingsDto>.Failure(new ApplicationError(ErrorCode.NotFound));
    private static Result<EstablishmentSettingsDto> Conflict() => Result<EstablishmentSettingsDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
    private static Result<EstablishmentSettingsDto> Invalid(string field) => Result<EstablishmentSettingsDto>.Failure(
        new ApplicationError(ErrorCode.ValidationFailed, new ValidationIssue(field, "invalid_establishment", "The establishment field is invalid.")));
    private static Result<TenantLegalProfileDto> InvalidLegal(string field) => Result<TenantLegalProfileDto>.Failure(
        new ApplicationError(ErrorCode.ValidationFailed, new ValidationIssue(field, "invalid_legal_profile", "The legal profile field is invalid.")));
}
