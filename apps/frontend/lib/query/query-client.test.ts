import { describe, expect, it } from "vitest"
import { createQueryClient } from "./query-client"

describe("createQueryClient", () => {
  it("creates an isolated query cache with safe default query behavior", () => {
    const first = createQueryClient()
    const second = createQueryClient()

    first.setQueryData(
      ["whiteplate", "tenant", "bistro", "en", "menu"],
      ["soup"]
    )

    expect(
      first.getQueryData(["whiteplate", "tenant", "bistro", "en", "menu"])
    ).toEqual(["soup"])
    expect(
      second.getQueryData(["whiteplate", "tenant", "bistro", "en", "menu"])
    ).toBeUndefined()
    expect(first.getDefaultOptions().queries).toMatchObject({ retry: false })
  })
})
