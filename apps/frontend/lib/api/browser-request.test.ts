import { afterEach, expect, it, vi } from "vitest"
import { browserRequest } from "./browser-request"

afterEach(() => vi.unstubAllGlobals())

it.each([
  "https://attacker.example/api/orders",
  "//attacker.example/api/orders",
  "/api/../outside",
  "/api/\\attacker.example/orders",
])(
  "rejects a non-API or external cookie-bearing target before I/O: %s",
  async (path) => {
    const fetcher = vi.fn()

    vi.stubGlobal("fetch", fetcher)

    await expect(browserRequest(path)).resolves.toEqual({
      ok: false,
      status: 400,
      error: "invalid",
    })
    expect(fetcher).not.toHaveBeenCalled()
  }
)
