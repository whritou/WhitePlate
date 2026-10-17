namespace WhitePlate.Domain.Orders;

public enum OrderCancellationReason
{
    CustomerRequest,
    ItemUnavailable,
    RestaurantUnableToFulfill,
    DuplicateOrder,
    Other
}
