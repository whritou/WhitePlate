using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace WhitePlate.Api.OpenApi;

public sealed class SameOriginServerDocumentTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        document.Servers = [new OpenApiServer { Url = "/" }];
        return Task.CompletedTask;
    }
}
