import { describe, expect, it, vi } from "vitest"
import { issueApiToken } from "./dev-token.mjs"

describe("local Swagger token helper", () => {
  it("exchanges a verified Better Auth sign-in session for an API token", async () => {
    const responseHeaders = new Headers()
    responseHeaders.append(
      "set-cookie",
      "better-auth.session_token=session-value; HttpOnly; Path=/"
    )
    responseHeaders.append(
      "set-cookie",
      "better-auth.session_data=cache-value; Path=/"
    )
    const auth = {
      api: {
        signInEmail: vi
          .fn()
          .mockResolvedValue(
            new Response(null, { status: 200, headers: responseHeaders })
          ),
        getSession: vi
          .fn()
          .mockResolvedValue({ user: { emailVerified: true } }),
        getToken: vi.fn().mockResolvedValue({ token: "api-jwt" }),
      },
    }

    await expect(
      issueApiToken(auth, "tester@whiteplate.invalid", "test-password")
    ).resolves.toBe("api-jwt")
    expect(auth.api.signInEmail).toHaveBeenCalledWith({
      body: { email: "tester@whiteplate.invalid", password: "test-password" },
      asResponse: true,
    })
    expect(auth.api.getSession).toHaveBeenCalledOnce()
    expect(auth.api.getToken).toHaveBeenCalledOnce()
    expect(auth.api.getToken.mock.calls[0][0].headers.get("cookie")).toBe(
      "better-auth.session_token=session-value; better-auth.session_data=cache-value"
    )
  })

  it("refuses to issue a token for an unverified account", async () => {
    const auth = {
      api: {
        signInEmail: vi.fn().mockResolvedValue(
          new Response(null, {
            status: 200,
            headers: {
              "set-cookie":
                "better-auth.session_token=session-value; HttpOnly; Path=/",
            },
          })
        ),
        getSession: vi
          .fn()
          .mockResolvedValue({ user: { emailVerified: false } }),
        getToken: vi.fn(),
      },
    }

    await expect(
      issueApiToken(auth, "tester@whiteplate.invalid", "test-password")
    ).rejects.toThrow("verified")
    expect(auth.api.getToken).not.toHaveBeenCalled()
  })
})
