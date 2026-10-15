using System.Text.Json.Serialization;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Contracts;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record UpdateThemeRequest : ThemeAppearance;
