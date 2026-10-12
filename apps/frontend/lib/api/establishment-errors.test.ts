import { expect, it } from "vitest"
import { createJsonRequestClient } from "./json-request-client"

it("returns only safe validation field names, never API messages or arbitrary payloads", async () => {
  const client = createJsonRequestClient({
    fetcher: async () =>
      Response.json(
        {
          detail: "secret",
          errors: [
            { field: "TimeZone", message: "private detail" },
            { field: "../secret" },
          ],
        },
        { status: 400 }
      ),
  })

  expect(await client.request("/api/establishment-settings")).toEqual({
    ok: false,
    status: 400,
    error: "invalid",
    validationFields: ["TimeZone"],
  })
})
