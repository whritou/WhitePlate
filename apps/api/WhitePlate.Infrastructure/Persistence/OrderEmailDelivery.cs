namespace WhitePlate.Infrastructure.Persistence;

public enum OrderEmailDeliveryStatus
{
    Pending,
    Sending,
    Accepted,
    Failed
}

public sealed class OrderEmailDelivery
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid OrderId { get; private set; }
    public string EventType { get; private set; } = null!;
    public string? RecipientEmail { get; private set; }
    public OrderEmailDeliveryStatus Status { get; private set; }
    public int AttemptCount { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public DateTimeOffset? LeaseUntil { get; private set; }
    public DateTimeOffset? AcceptedAt { get; private set; }
    public string? ProviderMessageId { get; private set; }
    public string? LastFailureCode { get; private set; }
    public string? SubjectSnapshot { get; private set; }
    public string? HtmlSnapshot { get; private set; }
    public string? TextSnapshot { get; private set; }

    private OrderEmailDelivery() { }

    public static OrderEmailDelivery Create(Guid eventId, Guid tenantId, Guid orderId, string eventType,
        string recipientEmail, DateTimeOffset createdAt) => new()
    {
        Id = eventId,
        TenantId = tenantId,
        OrderId = orderId,
        EventType = eventType,
        RecipientEmail = recipientEmail,
        Status = OrderEmailDeliveryStatus.Pending,
        CreatedAt = createdAt,
        NextAttemptAt = createdAt
    };

    public void Claim(DateTimeOffset now, TimeSpan lease)
    {
        Status = OrderEmailDeliveryStatus.Sending;
        AttemptCount++;
        LeaseUntil = now.Add(lease);
    }

    public void MarkAccepted(string providerMessageId, DateTimeOffset acceptedAt)
    {
        Status = OrderEmailDeliveryStatus.Accepted;
        ProviderMessageId = providerMessageId;
        AcceptedAt = acceptedAt;
        RecipientEmail = null;
        LeaseUntil = null;
        LastFailureCode = null;
        ClearSnapshot();
    }

    public void ScheduleRetry(DateTimeOffset retryAt, string failureCode)
    {
        Status = AttemptCount >= 10 ? OrderEmailDeliveryStatus.Failed : OrderEmailDeliveryStatus.Pending;
        NextAttemptAt = retryAt;
        RecipientEmail = Status == OrderEmailDeliveryStatus.Failed ? null : RecipientEmail;
        LeaseUntil = null;
        LastFailureCode = failureCode;
        if (Status == OrderEmailDeliveryStatus.Failed) ClearSnapshot();
    }

    public void Discard(string failureCode)
    {
        Status = OrderEmailDeliveryStatus.Failed;
        RecipientEmail = null;
        LeaseUntil = null;
        LastFailureCode = failureCode;
        ClearSnapshot();
    }

    public void SavePayloadSnapshot(string subject, string html, string text)
    {
        SubjectSnapshot = subject;
        HtmlSnapshot = html;
        TextSnapshot = text;
    }

    private void ClearSnapshot()
    {
        SubjectSnapshot = null;
        HtmlSnapshot = null;
        TextSnapshot = null;
    }

    public bool IsClaimable(DateTimeOffset now) => RecipientEmail is not null &&
        ((Status == OrderEmailDeliveryStatus.Pending && NextAttemptAt <= now) ||
         (Status == OrderEmailDeliveryStatus.Sending && LeaseUntil <= now));
}
