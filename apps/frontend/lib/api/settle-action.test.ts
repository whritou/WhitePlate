import { expect, it } from "vitest"
import type { ApiResult } from "@/types/api"
import { settleAction, unavailableActionResult } from "./settle-action"

it("returns the action result when the call resolves", async () => {
  const result = await settleAction<ApiResult<number>>(
    async () => ({ ok: true, status: 200, data: 1 }),
    unavailableActionResult
  )

  expect(result).toEqual({ ok: true, status: 200, data: 1 })
})

it("returns the fallback when the call rejects", async () => {
  const result = await settleAction(async () => {
    throw new TypeError("Failed to fetch")
  }, unavailableActionResult)

  expect(result).toEqual({ ok: false, status: 503, error: "unavailable" })
})
