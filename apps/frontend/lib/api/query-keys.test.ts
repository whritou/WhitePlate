import { describe, expect, it } from "vitest"
import { tenantApiQueryKeys } from "./query-keys"

describe("tenantApiQueryKeys", () => {
  it("separates tenant and locale data for tenant and menu queries", () => {
    expect(tenantApiQueryKeys.tenant("bistro", "en")).toEqual([
      "whiteplate",
      "tenant",
      "bistro",
      "en",
      "details",
    ])
    expect(tenantApiQueryKeys.menu("bistro", "fr")).toEqual([
      "whiteplate",
      "tenant",
      "bistro",
      "fr",
      "menu",
    ])
    expect(tenantApiQueryKeys.menu("bistro", "en")).not.toEqual(
      tenantApiQueryKeys.menu("other", "en")
    )
    expect(tenantApiQueryKeys.menu("bistro", "en")).not.toEqual(
      tenantApiQueryKeys.menu("bistro", "fr")
    )
  })

  it("normalizes tenant keys and rejects unsafe tenant or locale values", () => {
    expect(tenantApiQueryKeys.menu("BISTRO", "en")).toEqual(
      tenantApiQueryKeys.menu("bistro", "en")
    )
    expect(() => tenantApiQueryKeys.menu("../other", "en")).toThrow(
      "Invalid tenant identifier"
    )
    expect(() => tenantApiQueryKeys.menu("bistro", "de")).toThrow(
      "Unsupported locale"
    )
  })
})
