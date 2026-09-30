using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Results;

namespace WhitePlate.Api.Mapping;

public static class ResultMapping
{
    public static ActionResult<TResponse> ToResponse<TValue, TResponse>(this Result<TValue> result,
        HttpContext context, ApiErrorMapper errors, Func<TValue, TResponse> map) =>
        result.IsSuccess
            ? new OkObjectResult(map(result.Value))
            : errors.ToActionResult(errors.Create(context, result.Error));
}
