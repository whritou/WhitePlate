import { afterEach, expect, it, vi } from "vitest"
import { auth } from "@/lib/auth"
import { POST } from "./route"

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn(), getToken: vi.fn() } },
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

function makeRequest(origin?: string) {
  return new Request("http://localhost:3000/api/kitchen/signalr-token", {
    method: "POST",
    headers: origin === undefined ? {} : { Origin: origin },
  })
}

it.each([undefined, "https://attacker.example", "http://localhost:3001"])(
  "rejects missing or foreign origin %s before reading a session",
  async (origin) => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")

    const response = await POST(makeRequest(origin))

    expect(response.status).toBe(403)
    expect(auth.api.getSession).not.toHaveBeenCalled()
    expect(auth.api.getToken).not.toHaveBeenCalled()
  }
)

it.each([null, { user: { emailVerified: false } }])(
  "does not issue a token without a verified session",
  async (session) => {
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
    vi.mocked(auth.api.getSession).mockResolvedValue(session as never)

    const response = await POST(makeRequest("http://localhost:3000"))

    expect(response.status).toBe(401)
    expect(auth.api.getToken).not.toHaveBeenCalled()
  }
)

it("returns a short-lived API token without cache or cross-origin access", async () => {
  vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000")
  vi.mocked(auth.api.getSession).mockResolvedValue({
    user: { emailVerified: true },
  } as never)
  vi.mocked(auth.api.getToken).mockResolvedValue({
    token: "short-lived-api-token",
  } as never)

  const response = await POST(makeRequest("http://localhost:3000"))

  expect(response.status).toBe(200)
  expect(response.headers.get("cache-control")).toBe("no-store")
  expect(response.headers.get("access-control-allow-origin")).toBeNull()
  await expect(response.json()).resolves.toEqual({
    accessToken: "short-lived-api-token",
  })
  expect(auth.api.getToken).toHaveBeenCalledTimes(1)
})
