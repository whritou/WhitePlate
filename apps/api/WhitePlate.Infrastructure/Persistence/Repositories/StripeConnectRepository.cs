using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Payments;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StripeConnectRepository(WhitePlateDbContext dbContext) : IStripeConnectRepository
{
    public async Task<StripeConnectConnectionSnapshot?> GetConnectionAsync(Guid tenantId, StripeConnectMode mode,
        CancellationToken cancellationToken)
    {
        var record = await dbContext.StripeConnectConnections.AsNoTracking()
            .SingleOrDefaultAsync(row => row.TenantId == tenantId && row.Mode == mode, cancellationToken);
        return record is null ? null : ToSnapshot(record);
    }

    public async Task SaveOAuthStateAsync(StripeConnectOAuthState state, CancellationToken cancellationToken)
    {
        dbContext.StripeConnectOAuthStates.Add(new StripeConnectOAuthStateRecord
        {
            StateHash = state.StateHash,
            TenantId = state.TenantId,
            OwnerIssuer = state.OwnerIssuer,
            OwnerSubject = state.OwnerSubject,
            Mode = state.Mode,
            Locale = state.Locale,
            CreatedAt = state.CreatedAt,
            ExpiresAt = state.ExpiresAt
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<StripeConnectOAuthState?> ConsumeOAuthStateAsync(string stateHash, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        // Consuming by digest and an unset timestamp is atomic across concurrent callbacks.
        // Expired values are consumed too, so they can never become usable after a clock/config change.
        var updated = await dbContext.StripeConnectOAuthStates
            .Where(row => row.StateHash == stateHash && row.ConsumedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.ConsumedAt, now), cancellationToken);
        if (updated != 1) return null;

        var record = await dbContext.StripeConnectOAuthStates.AsNoTracking()
            .SingleOrDefaultAsync(row => row.StateHash == stateHash, cancellationToken);
        if (record is null || record.ExpiresAt <= now) return null;
        return new StripeConnectOAuthState(record.StateHash, record.TenantId, record.OwnerIssuer,
            record.OwnerSubject, record.Mode, record.Locale, record.CreatedAt, record.ExpiresAt);
    }

    public async Task<bool> SaveConnectionAsync(StripeConnectConnectionSnapshot connection, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var existing = await dbContext.StripeConnectConnections.SingleOrDefaultAsync(row =>
            row.TenantId == connection.TenantId && row.Mode == connection.Mode, cancellationToken);
        var accountInUse = await dbContext.StripeConnectConnections.AnyAsync(row => row.Mode == connection.Mode &&
            row.StripeAccountId == connection.StripeAccountId && row.TenantId != connection.TenantId,
            cancellationToken);
        if (accountInUse || existing?.ConnectionState == StripeConnectionState.Connected) return false;

        if (existing is null)
        {
            dbContext.StripeConnectConnections.Add(ToRecord(connection, now));
        }
        else
        {
            existing.StripeAccountId = connection.StripeAccountId;
            ApplySnapshot(existing, connection.Readiness, connection.ReadinessState);
            existing.ConnectionState = StripeConnectionState.Connected;
            existing.ConnectedAt = connection.ConnectedAt;
            existing.LastVerifiedAt = connection.LastVerifiedAt;
            existing.LastAppliedEventAt = null;
            existing.UpdatedAt = now;
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            return false;
        }
    }

    public async Task<bool> UpdateReadinessAsync(Guid tenantId, StripeConnectMode mode, string accountId,
        StripeAccountReadinessInput readiness, StripeReadinessState state, DateTimeOffset verifiedAt,
        CancellationToken cancellationToken)
    {
        var row = await dbContext.StripeConnectConnections.SingleOrDefaultAsync(connection =>
            connection.TenantId == tenantId && connection.Mode == mode && connection.StripeAccountId == accountId &&
            connection.ConnectionState == StripeConnectionState.Connected, cancellationToken);
        if (row is null) return false;
        ApplySnapshot(row, readiness, state);
        row.LastVerifiedAt = verifiedAt;
        row.UpdatedAt = verifiedAt;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ApplyWebhookAsync(StripeConnectWebhookEvent stripeEvent,
        StripeAccountReadinessInput? readiness, StripeReadinessState? readinessState,
        DateTimeOffset receivedAt, CancellationToken cancellationToken)
    {
        var mode = stripeEvent.LiveMode ? StripeConnectMode.Live : StripeConnectMode.Test;
        if (await dbContext.StripeConnectWebhookEvents.AnyAsync(row => row.Mode == mode &&
            row.EventId == stripeEvent.EventId, cancellationToken))
            return true;

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        dbContext.StripeConnectWebhookEvents.Add(new StripeConnectWebhookEventRecord
        {
            Mode = mode,
            EventId = stripeEvent.EventId,
            EventType = stripeEvent.EventType,
            StripeAccountId = stripeEvent.StripeAccountId,
            EventCreatedAt = stripeEvent.CreatedAt,
            ReceivedAt = receivedAt
        });

        var connection = await dbContext.StripeConnectConnections.SingleOrDefaultAsync(row =>
            row.Mode == mode && row.StripeAccountId == stripeEvent.StripeAccountId, cancellationToken);
        if (connection is not null &&
            (connection.LastAppliedEventAt is null || stripeEvent.CreatedAt > connection.LastAppliedEventAt.Value))
        {
            if (stripeEvent.EventType == "account.application.deauthorized")
            {
                connection.ConnectionState = StripeConnectionState.Disconnected;
                connection.ReadinessState = StripeReadinessState.Unknown;
                connection.LastAppliedEventAt = stripeEvent.CreatedAt;
                connection.UpdatedAt = receivedAt;
            }
            else if (stripeEvent.EventType == "account.updated" &&
                connection.ConnectionState == StripeConnectionState.Connected && readiness is not null &&
                readinessState is not null)
            {
                ApplySnapshot(connection, readiness, readinessState.Value);
                connection.LastVerifiedAt = receivedAt;
                connection.LastAppliedEventAt = stripeEvent.CreatedAt;
                connection.UpdatedAt = receivedAt;
            }
        }

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            return exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation };
        }
    }

    private static StripeConnectConnectionSnapshot ToSnapshot(StripeConnectConnectionRecord record) =>
        new(record.TenantId, record.Mode, record.StripeAccountId, record.ConnectionState, record.ReadinessState,
            new StripeAccountReadinessInput(record.DetailsSubmitted, record.ChargesEnabled, record.PayoutsEnabled,
                record.CardPaymentsCapabilityStatus, record.CurrentlyDueCount, record.PastDueCount,
                record.PendingVerificationCount), record.ConnectedAt, record.LastVerifiedAt,
            record.LastAppliedEventAt);

    private static StripeConnectConnectionRecord ToRecord(StripeConnectConnectionSnapshot snapshot,
        DateTimeOffset now)
    {
        var row = new StripeConnectConnectionRecord
        {
            TenantId = snapshot.TenantId,
            Mode = snapshot.Mode,
            StripeAccountId = snapshot.StripeAccountId,
            ConnectionState = snapshot.ConnectionState,
            ConnectedAt = snapshot.ConnectedAt,
            LastVerifiedAt = snapshot.LastVerifiedAt,
            LastAppliedEventAt = snapshot.LastAppliedEventAt,
            UpdatedAt = now
        };
        ApplySnapshot(row, snapshot.Readiness, snapshot.ReadinessState);
        return row;
    }

    private static void ApplySnapshot(StripeConnectConnectionRecord row, StripeAccountReadinessInput readiness,
        StripeReadinessState state)
    {
        row.ReadinessState = state;
        row.DetailsSubmitted = readiness.DetailsSubmitted;
        row.ChargesEnabled = readiness.ChargesEnabled;
        row.PayoutsEnabled = readiness.PayoutsEnabled;
        row.CardPaymentsCapabilityStatus = readiness.CardPaymentsCapabilityStatus;
        row.CurrentlyDueCount = readiness.CurrentlyDueCount;
        row.PastDueCount = readiness.PastDueCount;
        row.PendingVerificationCount = readiness.PendingVerificationCount;
    }
}
