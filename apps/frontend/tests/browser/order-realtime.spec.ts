import { expect, test } from "@playwright/test"
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
import { OrderEventTracker, parseOrderPage } from "@/lib/order-dashboard"
import {
  createAcceptanceOrder,
  localApi,
  staffFixture,
  transition,
} from "./staff-fixture"

test("live outbox delivery, tenant isolation, revocation and reconnect recovery", async ({
  browser,
}) => {
  test.setTimeout(180_000)

  const fixture = await staffFixture(browser)
  const { tenantId } = fixture.restaurant
  const actors = [
    fixture.owner,
    fixture.manager,
    fixture.kitchen,
    fixture.foreign,
  ]
  const events = actors.map(() => [] as unknown[])
  const tokenReads = actors.map(() => 0)
  const connections = actors.map((actor, index) => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${localApi}/hubs/orders`, {
        accessTokenFactory: async () => {
          tokenReads[index] += 1

          const response = await actor.context.request.post(
            "http://localhost:3000/api/kitchen/signalr-token",
            { headers: { Origin: "http://localhost:3000" } }
          )

          expect(response.status()).toBe(200)
          expect(response.headers()["cache-control"]).toBe("no-store")

          return (await response.json()).accessToken
        },
      })
      .configureLogging(LogLevel.None)
      .build()

    connection.on("order.changed", (event: unknown) =>
      events[index].push(event)
    )

    return connection
  })

  async function dispatched(orderId: string) {
    const result = await fixture.database.query(
      'SELECT "Id", "DispatchedAt", "Attempts" FROM "OrderOutboxMessages" WHERE "TenantId"=$1 AND "PayloadJson"::jsonb->>\'orderId\'=$2 ORDER BY "OccurredAt" DESC LIMIT 1',
      [tenantId, orderId]
    )

    return result.rows[0]
  }

  try {
    const preflight = await fixture.owner.context.request.fetch(
      `${localApi}/hubs/orders/negotiate?negotiateVersion=1`,
      {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "authorization",
        },
      }
    )
    const foreignOrigin = await fixture.owner.context.request.fetch(
      `${localApi}/hubs/orders/negotiate?negotiateVersion=1`,
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://foreign.example.test",
          "Access-Control-Request-Method": "POST",
        },
      }
    )

    expect(preflight.headers()["access-control-allow-origin"]).toBe(
      "http://localhost:3000"
    )
    expect(
      foreignOrigin.headers()["access-control-allow-origin"]
    ).toBeUndefined()

    for (const connection of connections) await connection.start()
    for (const connection of connections.slice(0, 3))
      await connection.invoke("JoinRestaurant", tenantId)
    await connections[3].invoke("JoinRestaurant", fixture.otherTenantId)
    await expect(
      connections[3].invoke("JoinRestaurant", tenantId)
    ).rejects.toThrow("Restaurant access is required")
    await expect(
      connections[1].invoke("JoinRestaurant", fixture.otherTenantId)
    ).rejects.toThrow("Restaurant access is required")

    const order = await createAcceptanceOrder(
      fixture,
      "Live delivery acceptance"
    )

    for (const received of events.slice(0, 3))
      await expect
        .poll(() => received)
        .toContainEqual(
          expect.objectContaining({ orderId: order.id, version: 1 })
        )
    await expect
      .poll(async () => (await dispatched(order.id))?.DispatchedAt)
      .toBeTruthy()
    expect(events[3]).toEqual([])

    const headers = { Authorization: `Bearer ${fixture.owner.token}` }
    const category = await fixture.owner.context.request.post(
      `${localApi}/api/v1/tenants/${fixture.otherTenantId}/categories`,
      { headers, data: { name: "Isolated live events", sortOrder: 0 } }
    )
    const product = await fixture.owner.context.request.post(
      `${localApi}/api/v1/tenants/${fixture.otherTenantId}/products`,
      {
        headers,
        data: {
          categoryId: (await category.json()).id,
          name: "Isolated soup",
          basePrice: 5,
          taxRatePercent: 0,
          sortOrder: 0,
        },
      }
    )
    const foreignOrder = await fixture.foreign.context.request.post(
      `${localApi}/api/v1/orders`,
      {
        headers: {
          Host: `${fixture.otherTenantSlug}.localhost:5182`,
          "Idempotency-Key": crypto.randomUUID(),
        },
        data: {
          customerName: "Isolated delivery acceptance",
          menuLocale: "en",
          items: [
            {
              productId: (await product.json()).id,
              quantity: 1,
              optionIds: [],
            },
          ],
        },
      }
    )

    expect(category.status()).toBe(201)
    expect(product.status()).toBe(201)
    expect(foreignOrder.status()).toBe(201)

    const foreignReceipt = await foreignOrder.json()

    await expect
      .poll(() => events[3])
      .toContainEqual(
        expect.objectContaining({
          orderId: foreignReceipt.id,
          tenantId: fixture.otherTenantId,
        })
      )
    for (const received of events.slice(0, 3))
      expect(received).not.toContainEqual(
        expect.objectContaining({ orderId: foreignReceipt.id })
      )

    const delivered = await dispatched(order.id)
    const tracker = new OrderEventTracker(tenantId)
    const event = events[1].find((item) => tracker.shouldRefresh(item))

    expect(event).toEqual(expect.objectContaining({ eventId: delivered.Id }))
    expect(tracker.shouldRefresh(event)).toBe(false)

    // Simulate a process crash after sending but before acknowledging this test event.
    await fixture.database.query(
      'UPDATE "OrderOutboxMessages" SET "DispatchedAt"=NULL,"LeaseUntil"=NULL,"AvailableAt"=now() WHERE "Id"=$1 AND "TenantId"=$2',
      [delivered.Id, tenantId]
    )
    await expect
      .poll(
        () =>
          events[1].filter(
            (item) => JSON.stringify(item) === JSON.stringify(event)
          ).length
      )
      .toBe(2)
    await expect
      .poll(async () => (await dispatched(order.id))?.DispatchedAt)
      .toBeTruthy()
    expect((await dispatched(order.id)).Attempts).toBeGreaterThan(
      delivered.Attempts
    )
    expect(tracker.shouldRefresh(events[1].at(-1))).toBe(false)

    // Exercise the real retry path with a malformed payload on this already delivered test event only.
    const payload = await fixture.database.query(
      'SELECT "PayloadJson" FROM "OrderOutboxMessages" WHERE "Id"=$1 AND "TenantId"=$2',
      [delivered.Id, tenantId]
    )

    await fixture.database.query(
      'UPDATE "OrderOutboxMessages" SET "PayloadJson"=\'null\',"DispatchedAt"=NULL,"LeaseUntil"=NULL,"AvailableAt"=now() WHERE "Id"=$1 AND "TenantId"=$2',
      [delivered.Id, tenantId]
    )

    try {
      await expect
        .poll(async () => {
          const retry = await fixture.database.query(
            'SELECT "Attempts","LeaseUntil","AvailableAt" FROM "OrderOutboxMessages" WHERE "Id"=$1 AND "TenantId"=$2',
            [delivered.Id, tenantId]
          )
          const row = retry.rows[0]

          return (
            row?.Attempts > delivered.Attempts + 1 &&
            row.LeaseUntil === null &&
            row.AvailableAt.getTime() > Date.now()
          )
        })
        .toBe(true)

      const retry = await fixture.database.query(
        'SELECT "DispatchedAt","AvailableAt","LeaseUntil" FROM "OrderOutboxMessages" WHERE "Id"=$1 AND "TenantId"=$2',
        [delivered.Id, tenantId]
      )

      expect(retry.rows[0].DispatchedAt).toBeNull()
      expect(retry.rows[0].LeaseUntil).toBeNull()
      expect(retry.rows[0].AvailableAt.getTime()).toBeGreaterThan(Date.now())
    } finally {
      await fixture.database.query(
        'UPDATE "OrderOutboxMessages" SET "PayloadJson"=$1 WHERE "Id"=$2 AND "TenantId"=$3',
        [payload.rows[0].PayloadJson, delivered.Id, tenantId]
      )
    }

    await expect
      .poll(async () => (await dispatched(order.id))?.DispatchedAt)
      .toBeTruthy()

    const changed = await transition({
      request: fixture.manager.context.request,
      token: fixture.manager.token,
      tenantId,
      orderId: order.id,
      version: 1,
      status: "Preparing",
    })

    expect(changed.status()).toBe(200)
    await expect
      .poll(() => events[1])
      .toContainEqual(
        expect.objectContaining({ orderId: order.id, version: 2 })
      )

    const tokenReadsBeforeReconnect = tokenReads[1]

    await connections[1].stop()

    const missed = await createAcceptanceOrder(
      fixture,
      "Offline recovery acceptance"
    )

    await expect
      .poll(async () => (await dispatched(missed.id))?.DispatchedAt)
      .toBeTruthy()
    await connections[1].start()
    await connections[1].invoke("JoinRestaurant", tenantId)
    expect(tokenReads[1]).toBeGreaterThan(tokenReadsBeforeReconnect)

    const restored = await fixture.manager.context.request.get(
      `${localApi}/api/v1/tenants/${tenantId}/orders`,
      { headers: { Authorization: `Bearer ${fixture.manager.token}` } }
    )
    const page = parseOrderPage(await restored.json())

    expect(restored.status()).toBe(200)
    expect(page?.items).toContainEqual(
      expect.objectContaining({ id: missed.id })
    )
    expect(events[1]).not.toContainEqual(
      expect.objectContaining({ orderId: missed.id })
    )

    // Leave the kitchen socket open while removing only this generated test membership.
    await fixture.database.query(
      'DELETE FROM "RestaurantMemberships" WHERE "TenantId"=$1 AND "Subject"=$2 AND "Issuer"=$3',
      [tenantId, fixture.kitchen.id, "http://localhost:3000"]
    )

    const afterRevocation = await createAcceptanceOrder(
      fixture,
      "Revoked delivery acceptance"
    )

    for (const received of events.slice(0, 2))
      await expect
        .poll(() => received)
        .toContainEqual(
          expect.objectContaining({ orderId: afterRevocation.id })
        )
    await expect
      .poll(async () => (await dispatched(afterRevocation.id))?.DispatchedAt)
      .toBeTruthy()
    expect(events[2]).not.toContainEqual(
      expect.objectContaining({ orderId: afterRevocation.id })
    )
    expect(events[3]).not.toContainEqual(expect.objectContaining({ tenantId }))
    await expect(
      connections[2].invoke("JoinRestaurant", tenantId)
    ).rejects.toThrow("Restaurant access is required")
  } finally {
    await Promise.all(connections.map((connection) => connection.stop()))
    await fixture.cleanup()
  }
})
