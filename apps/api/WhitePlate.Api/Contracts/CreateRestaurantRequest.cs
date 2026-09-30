namespace WhitePlate.Api.Contracts;

public sealed record CreateRestaurantRequest(string Name, string Subdomain, string Currency);
