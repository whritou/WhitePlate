using System.Text.Json;
using System.Text.Json.Serialization;

namespace WhitePlate.Application.Catalog;

public static class CatalogPublicationJson
{
    public static JsonSerializerOptions Options { get; } = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };
}
