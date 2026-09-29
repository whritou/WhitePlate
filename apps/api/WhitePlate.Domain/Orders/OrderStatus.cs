namespace WhitePlate.Domain.Orders;

public enum OrderStatus { Pending = 1, Preparing = 2, Ready = 3, Completed = 4, Cancelled = 5 }

public sealed class InvalidOrderTransitionException() : Exception("The requested order status transition is invalid.");
