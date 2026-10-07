using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Configuration;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Orders;
using WhitePlate.Application.Tenants;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public sealed class OrdersController(ICurrentTenant currentTenant, ICurrentIdentity currentIdentity,
    CreateOrderCommandHandler createOrder, CheckoutRequestRateLimiter checkoutRateLimiter,
    ListOrdersQueryHandler listOrders, ListOrderHistoryQueryHandler listOrderHistory,
    UpdateOrderStatusCommandHandler updateStatus, ApiErrorMapper errors) : ControllerBase
{
    [HttpPost]
    [RequireTenant]
    [RequestSizeLimit(16 * 1024)]
    [AllowAnonymous]
    [ProducesResponseType<OrderReceiptDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status413PayloadTooLarge, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status429TooManyRequests, "application/problem+json")]
    public async Task<ActionResult<OrderReceiptDto>> Create(CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var tenant = currentTenant.Tenant ?? throw new InvalidOperationException("Tenant resolution is required.");
        var clientAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        using var lease = await checkoutRateLimiter.AcquireAsync($"{tenant.Id:N}|{clientAddress}", cancellationToken);
        if (!lease.IsAcquired)
            return errors.ToActionResult(errors.FromStatus(HttpContext, StatusCodes.Status429TooManyRequests));
        var items = request.Items?.Select(item => new CreateOrderItem(item.ProductId, item.Quantity, item.OptionIds))
            .ToArray();
        var command = new CreateOrderCommand(tenant.Id, request.CustomerName, request.DiscountCode,
            request.MenuLocale, items,
            Request.Headers["Idempotency-Key"].FirstOrDefault());
        var result = await createOrder.HandleAsync(command, cancellationToken);
        if (!result.IsSuccess)
            return errors.ToActionResult(errors.Create(HttpContext, result.Error));

        Response.Headers["ETag"] = $"\"{result.Value.Version}\"";
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpGet("/api/v1/tenants/{tenantId:guid}/orders")]
    [Authorize]
    [ProducesResponseType<OrderPageDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<OrderPageDto>> List(Guid tenantId, [FromQuery] string? status, [FromQuery] string? cursor,
        [FromQuery] int? pageSize, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        OrderStatus? parsedStatus = null;
        if (status is not null)
        {
            if (!Enum.TryParse<OrderStatus>(status, ignoreCase: false, out var value) || !Enum.IsDefined(value))
                return errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.ValidationFailed,
                    new ValidationIssue("status", "invalid_status", "The order status is invalid."))));
            parsedStatus = value;
        }

        var result = await listOrders.HandleAsync(new ListOrdersQuery(tenantId, parsedStatus, cursor, pageSize),
            identity, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpGet("/api/v1/tenants/{tenantId:guid}/orders/history")]
    [Authorize]
    [ProducesResponseType<OrderHistoryPageDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<ActionResult<OrderHistoryPageDto>> History(Guid tenantId, [FromQuery] string? status,
        [FromQuery] string? search, [FromQuery] string? from, [FromQuery] string? through,
        [FromQuery] string sort = "createdAt", [FromQuery] string direction = "desc",
        [FromQuery] int page = 1, [FromQuery] int pageSize = 25, CancellationToken cancellationToken = default)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        OrderStatus? parsedStatus = null;
        if (status is not null)
        {
            if (!Enum.TryParse<OrderStatus>(status, ignoreCase: false, out var value) || !Enum.IsDefined(value))
                return InvalidHistoryFilter("status");
            parsedStatus = value;
        }

        if (!TryParseDate(from, out var fromDate) || !TryParseDate(through, out var throughDate))
            return InvalidHistoryFilter("date");
        var result = await listOrderHistory.HandleAsync(new ListOrderHistoryQuery(tenantId, parsedStatus,
            search?.Trim(), fromDate, throughDate, sort, direction, page, pageSize), identity, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    private ActionResult InvalidHistoryFilter(string field) => errors.ToActionResult(errors.Create(HttpContext,
        new ApplicationError(ErrorCode.ValidationFailed,
            new ValidationIssue(field, "invalid_order_history_filter", "The order history filter is invalid."))));

    private static bool TryParseDate(string? value, out DateOnly? date)
    {
        date = null;
        if (value is null) return true;
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", out var parsed)) return false;
        date = parsed;
        return true;
    }

    [HttpPatch("/api/v1/tenants/{tenantId:guid}/orders/{orderId:guid}/status")]
    [Authorize]
    [ProducesResponseType<OrderReceiptDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status409Conflict, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status412PreconditionFailed, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status428PreconditionRequired, "application/problem+json")]
    public async Task<ActionResult<OrderReceiptDto>> UpdateStatus(Guid tenantId, Guid orderId, UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var rawTag = Request.Headers["If-Match"].ToString().Trim();
        if (rawTag.Length == 0)
            return errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.PreconditionRequired)));
        if (rawTag.Length < 3 || rawTag[0] != '"' || rawTag[^1] != '"' ||
            !int.TryParse(rawTag.AsSpan(1, rawTag.Length - 2), out var expectedVersion) || expectedVersion < 1)
            return errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("If-Match", "invalid_etag", "If-Match must contain one quoted order version."))));
        if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: false, out var status) || !Enum.IsDefined(status))
            return errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("status", "invalid_status", "The order status is invalid."))));

        var result = await updateStatus.HandleAsync(new UpdateOrderStatusCommand(tenantId, orderId,
            expectedVersion, status, identity), cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers["ETag"] = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }
}
