using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Contracts;

public sealed record UpdateOrderEmailSettingsRequest(IReadOnlyList<OrderEmailLocaleTemplatesDto>? Templates);
