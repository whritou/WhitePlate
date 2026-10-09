namespace WhitePlate.Domain.Media;

public sealed class MediaAsset
{
    private MediaAsset() { }
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Slot { get; private set; } = "";
    public string ContentType { get; private set; } = "";
    public string ObjectKey { get; private set; } = "";
    public int Width { get; private set; }
    public int Height { get; private set; }
    public long Bytes { get; private set; }
    public bool IsReady { get; private set; }
    public bool IsActive { get; private set; }
    public bool WasPublished { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? ExpiresAt { get; private set; }

    public static bool IsSlot(string slot) => slot is "logo" or "favicon" or "banner";

    public static MediaAsset Create(Guid tenantId, string slot, string contentType, int width, int height,
        long bytes, DateTimeOffset now)
    {
        if (!IsSlot(slot) || tenantId == Guid.Empty || width < 1 || height < 1 || bytes < 1 ||
            contentType is not ("image/png" or "image/webp")) throw new ArgumentException("Invalid media metadata.");
        var id = Guid.NewGuid();
        return new MediaAsset { Id = id, TenantId = tenantId, Slot = slot, ContentType = contentType,
            ObjectKey = $"tenants/{tenantId:N}/media/{id:N}", Width = width, Height = height, Bytes = bytes,
            CreatedAt = now, ExpiresAt = now.AddHours(24) };
    }

    public void MarkReady() => IsReady = true;
    public void Activate()
    {
        if (!IsReady) throw new InvalidOperationException("The asset is not stored.");
        IsActive = true;
        WasPublished = true;
        ExpiresAt = null;
    }
    public void Retire(DateTimeOffset now)
    {
        IsActive = false;
        ExpiresAt = now.AddDays(7);
    }
}
