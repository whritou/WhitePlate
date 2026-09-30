using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed class ListOrdersQueryHandler(IOrderRepository orders, IStaffMembershipRepository memberships)
{
    public async Task<Result<OrderPageDto>> HandleAsync(ListOrdersQuery query, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (!await OrderStaffAccess.CanViewAsync(memberships, query.TenantId, identity, cancellationToken))
            return Result<OrderPageDto>.Failure(new ApplicationError(ErrorCode.Forbidden));

        var pageSize = query.PageSize ?? 50;
        if (pageSize is < 1 or > 100)
            return Result<OrderPageDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("pageSize", "invalid_page_size", "Page size must be between 1 and 100.")));
        if (!OrderCursorCodec.TryDecode(query.Cursor, out var cursor))
            return Result<OrderPageDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("cursor", "invalid_cursor", "The order cursor is invalid.")));

        var page = await orders.ListAsync(query.TenantId, query.Status, cursor, pageSize, cancellationToken);
        var nextCursor = page.NextCursor is null ? null : OrderCursorCodec.Encode(page.NextCursor);
        return Result<OrderPageDto>.Success(new OrderPageDto(page.Items, nextCursor));
    }
}

internal static class OrderCursorCodec
{
    public static string Encode(OrderPageCursor cursor)
    {
        var value = $"{cursor.CreatedAtTicks}:{cursor.Id:D}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(value)).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryDecode(string? token, out OrderPageCursor? cursor)
    {
        cursor = null;
        if (string.IsNullOrWhiteSpace(token) || token.Length > 128) return token is null;
        try
        {
            var base64 = token.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + (4 - base64.Length % 4) % 4, '=');
            var parts = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64)).Split(':');
            if (parts.Length != 2 || !long.TryParse(parts[0], out var ticks) ||
                !Guid.TryParseExact(parts[1], "D", out var id) || id == Guid.Empty ||
                ticks < DateTimeOffset.MinValue.UtcDateTime.Ticks || ticks > DateTimeOffset.MaxValue.UtcDateTime.Ticks)
                return false;
            cursor = new OrderPageCursor(ticks, id);
            return true;
        }
        catch (FormatException) { return false; }
    }
}
