import { expect } from "@playwright/test"
import { randomBytes, randomUUID } from "node:crypto"
import { readFile } from "node:fs/promises"
import { hashPassword } from "better-auth/crypto"
import { Client } from "pg"
import { requireAcceptanceDatabase } from "./acceptance-environment"
import type { Browser, BrowserContext } from "@playwright/test"
import type {
  AcceptanceActor,
  AcceptanceRestaurant,
  ActorOptions,
  StaffFixture,
  AcceptanceApiInput,
} from "@/types/acceptance"

export const localApi = "http://localhost:5182"

const origin = "http://localhost:3000"

async function login(
  context: BrowserContext,
  email: string,
  password: string
): Promise<string> {
  const response = await context.request.post(
    `${origin}/api/auth/sign-in/email`,
    { data: { email, password }, headers: { Origin: origin } }
  )

  expect(response.status()).toBe(200)

  const tokenResponse = await context.request.post(
    `${origin}/api/kitchen/signalr-token`,
    { headers: { Origin: origin } }
  )

  expect(tokenResponse.status()).toBe(200)

  return (await tokenResponse.json()).accessToken
}

async function actor({
  browser,
  database,
  role,
  stamp,
}: ActorOptions): Promise<AcceptanceActor> {
  const id = randomUUID()
  const email = `acceptance-${role}-${stamp}@whiteplate.invalid`
  const password = randomBytes(24).toString("base64url")
  const hash = await hashPassword(password)

  await database.query(
    'INSERT INTO auth."user" (id,name,email,"emailVerified") VALUES ($1,$2,$3,true)',
    [id, `Acceptance ${role}`, email]
  )
  await database.query(
    'INSERT INTO auth.account (id,"accountId","providerId","userId",password,"updatedAt") VALUES ($1,$2,$3,$2,$4,now())',
    [randomUUID(), id, "credential", hash]
  )

  const context = await browser.newContext({ baseURL: origin })
  const token = await login(context, email, password)

  return { id, email, context, token }
}

export async function staffFixture(browser: Browser): Promise<StaffFixture> {
  requireAcceptanceDatabase()

  const email = process.env.WHITEPLATE_DEV_EMAIL
  const password = process.env.WHITEPLATE_DEV_PASSWORD

  if (!email?.endsWith(".invalid") || !password)
    throw new Error("Configure the verified local .invalid acceptance account")

  const restaurant: AcceptanceRestaurant = JSON.parse(
    await readFile(".acceptance/restaurant.json", "utf8")
  )
  const database = new Client({ connectionString: process.env.DATABASE_URL })

  await database.connect()

  const stamp = Date.now().toString(36)
  const ownerContext = await browser.newContext({ baseURL: origin })
  const ownerToken = await login(ownerContext, email, password)
  const owner = {
    id: "existing-local-owner",
    email,
    context: ownerContext,
    token: ownerToken,
  }
  const actors: AcceptanceActor[] = []

  async function cleanup() {
    for (const item of actors) {
      await database.query(
        'DELETE FROM "RestaurantMemberships" WHERE "Subject"=$1 AND "Issuer"=$2',
        [item.id, origin]
      )
      await database.query('DELETE FROM auth.session WHERE "userId"=$1', [
        item.id,
      ])
      await item.context.close()
    }

    await ownerContext.close()
    await database.end()
  }

  try {
    for (const role of ["manager", "kitchen", "foreign"])
      actors.push(await actor({ browser, database, role, stamp }))

    const [manager, kitchen, foreign] = actors
    const secondRestaurant = await ownerContext.request.post(
      `${localApi}/api/v1/organizations/${restaurant.organizationId}/restaurants`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
        data: {
          name: `Isolation ${stamp}`,
          subdomain: `isolation-${stamp}`,
          currency: "GBP",
        },
      }
    )

    expect(secondRestaurant.status()).toBe(201)

    const otherTenantId = (await secondRestaurant.json()).id

    for (const [item, role, tenantId] of [
      [manager, "RestaurantManager", restaurant.tenantId],
      [kitchen, "KitchenStaff", restaurant.tenantId],
      [foreign, "KitchenStaff", otherTenantId],
    ] as const) {
      const invitation = await ownerContext.request.post(
        `${localApi}/api/v1/organizations/${restaurant.organizationId}/invitations`,
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
          data: { tenantId, email: item.email, role },
        }
      )

      expect(invitation.status()).toBe(201)

      const accepted = await item.context.request.post(
        `${localApi}/api/v1/invitations/accept`,
        {
          headers: { Authorization: `Bearer ${item.token}` },
          data: { token: (await invitation.json()).token },
        }
      )

      expect(accepted.status()).toBe(204)
    }

    const headers = { Authorization: `Bearer ${ownerToken}` }
    const category = await ownerContext.request.post(
      `${localApi}/api/v1/tenants/${restaurant.tenantId}/categories`,
      { headers, data: { name: `Staff acceptance ${stamp}`, sortOrder: 0 } }
    )

    expect(category.status()).toBe(201)

    const product = await ownerContext.request.post(
      `${localApi}/api/v1/tenants/${restaurant.tenantId}/products`,
      {
        headers,
        data: {
          categoryId: (await category.json()).id,
          name: `Staff soup ${stamp}`,
          description: null,
          basePrice: 7.5,
          taxRatePercent: 5.5,
          sortOrder: 0,
        },
      }
    )

    expect(product.status()).toBe(201)

    return {
      restaurant,
      database,
      owner,
      manager,
      kitchen,
      foreign,
      productId: (await product.json()).id,
      otherTenantId,
      otherTenantSlug: `isolation-${stamp}`,
      cleanup,
    }
  } catch (error) {
    await cleanup()

    throw error
  }
}

export async function createAcceptanceOrder(
  fixture: StaffFixture,
  name: string
) {
  const response = await fixture.owner.context.request.post(
    `${localApi}/api/v1/orders`,
    {
      headers: {
        Host: `${fixture.restaurant.slug}.localhost:5182`,
        "Idempotency-Key": randomUUID(),
      },
      data: {
        customerName: name,
        menuLocale: "en",
        items: [{ productId: fixture.productId, quantity: 1, optionIds: [] }],
      },
    }
  )

  expect(response.status()).toBe(201)

  return response.json()
}

export function transition({
  request,
  token,
  tenantId,
  orderId,
  version,
  status,
}: AcceptanceApiInput) {
  return request.patch(
    `${localApi}/api/v1/tenants/${tenantId}/orders/${orderId}/status`,
    {
      headers: { Authorization: `Bearer ${token}`, "If-Match": `"${version}"` },
      data: { status },
    }
  )
}
