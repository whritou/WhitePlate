// Local-only deterministic API fixture. Does not connect to a database or send email.
import { createServer } from "node:http"
import { randomUUID } from "node:crypto"

const tenantId = "22222222-2222-4222-8222-222222222222"
const productId = "11111111-1111-4111-8111-111111111111"
const optionId = "44444444-4444-4444-8444-444444444444"
const stored = new Map()
const rateLimited = new Set()
let writes = 0
let replays = 0
let conflicts = 0

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost")
  const send = (status, body) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    })
    response.end(JSON.stringify(body))
  }
  if (url.pathname === "/__results")
    return send(200, { writes, replays, conflicts, storedOrders: stored.size })
  if (url.pathname === "/api/v1/menu") {
    const french = url.searchParams.get("locale") === "fr"
    return send(200, {
      tenantId: request.headers.host?.startsWith("harbor.")
        ? "55555555-5555-4555-8555-555555555555"
        : tenantId,
      restaurantName: "Bistro fixture",
      restaurantDescription: french
        ? "Une cuisine de saison, préparée avec soin."
        : "Seasonal cooking, prepared with care.",
      currency: "EUR",
      locale: french ? "fr" : "en",
      defaultLocale: "en",
      availableLocales: ["en", "fr"],
      categories: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          name: french ? "Menu du jour" : "Today's menu",
          sortOrder: 0,
          products: [
            {
              id: productId,
              name: french ? "Soupe" : "Soup",
              description: french ? "Légumes de saison" : "Seasonal vegetables",
              basePrice: 10,
              isAvailable: true,
              optionGroups: [
                {
                  id: "77777777-7777-4777-8777-777777777777",
                  name: french ? "Pain" : "Bread",
                  minimumSelections: 1,
                  maximumSelections: 1,
                  options: [
                    {
                      id: optionId,
                      name: french ? "Levain" : "Sourdough",
                      priceAdjustment: 1,
                    },
                  ],
                },
              ],
            },
            {
              id: "88888888-8888-4888-8888-888888888888",
              name: french ? "Tarte" : "Tart",
              description: null,
              basePrice: 5,
              isAvailable: false,
              optionGroups: [],
            },
          ],
        },
      ],
    })
  }
  if (url.pathname !== "/api/v1/orders" || request.method !== "POST")
    return send(404, {})
  let raw = ""
  for await (const chunk of request) raw += chunk
  const input = JSON.parse(raw)
  const key = `${request.headers.host}:${request.headers["idempotency-key"]}`
  const previous = stored.get(key)
  if (previous) {
    if (previous.raw !== raw) {
      conflicts++
      return send(409, { detail: "fixture conflict" })
    }
    replays++
    return send(201, previous.receipt)
  }
  if (input.customerName === "CONFLICT") {
    conflicts++
    return send(409, { detail: "fixture conflict" })
  }
  if (input.customerName === "RATE_LIMIT" && !rateLimited.has(key)) {
    rateLimited.add(key)
    return send(429, { detail: "fixture rate limit" })
  }
  if (
    !input.customerName?.trim() ||
    !input.items?.length ||
    (input.discountCode && input.discountCode !== "LUNCH")
  )
    return send(400, { detail: "fixture validation" })
  const quantity = input.items[0].quantity
  const subtotal = 11 * quantity
  const discountAmount = input.discountCode ? subtotal / 10 : 0
  const taxAmount = (subtotal - discountAmount) / 10
  const menuLocale = input.menuLocale === "fr" ? "fr" : "en"
  const receipt = {
    id: randomUUID(),
    tenantId,
    customerName: input.customerName,
    menuLocale,
    currency: "EUR",
    discountCode: input.discountCode,
    subtotal,
    discountAmount,
    taxAmount,
    total: subtotal - discountAmount + taxAmount,
    status: "Pending",
    version: 1,
    createdAt: new Date().toISOString(),
    lines: [
      {
        productId,
        productName: menuLocale === "fr" ? "Soupe" : "Soup",
        baseUnitPrice: 10,
        taxRatePercent: 10,
        quantity,
        subtotal,
        discountAmount,
        taxAmount,
        total: subtotal - discountAmount + taxAmount,
        options: [
          {
            optionId,
            name: menuLocale === "fr" ? "Levain" : "Sourdough",
            priceAdjustment: 1,
          },
        ],
      },
    ],
  }
  stored.set(key, { raw, receipt })
  writes++
  if (input.customerName === "LOST_RESPONSE") return request.socket.destroy()
  return send(201, receipt)
})

server.listen(5189, "127.0.0.1", () =>
  console.log("Checkout fixture listening on 127.0.0.1:5189")
)
