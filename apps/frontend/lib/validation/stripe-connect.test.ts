import { describe, expect, it } from "vitest"
import {
  parseStripeConnectStart,
  parseStripeConnectStatus,
} from "./stripe-connect"

describe("Stripe Connect response parsing", () => {
  it("accepts a mode-bound status and Stripe Dashboard URL", () => {
    expect(
      parseStripeConnectStatus({
        mode: "test",
        connectionState: "connected",
        readinessState: "pending_verification",
        lastVerifiedAt: "2026-10-17T12:00:00Z",
        canManage: true,
        dashboardUrl: "https://dashboard.stripe.com/test",
      })
    ).toEqual({
      mode: "test",
      connectionState: "connected",
      readinessState: "pending_verification",
      lastVerifiedAt: "2026-10-17T12:00:00Z",
      canManage: true,
      dashboardUrl: "https://dashboard.stripe.com/test",
    })
  })

  it("rejects a dashboard URL that does not match the returned mode", () => {
    expect(
      parseStripeConnectStatus({
        mode: "test",
        connectionState: "connected",
        readinessState: "verified",
        lastVerifiedAt: null,
        canManage: true,
        dashboardUrl: "https://dashboard.stripe.com/",
      })
    ).toBeNull()
  })

  it("accepts only Stripe's hosted OAuth authorization URL", () => {
    expect(
      parseStripeConnectStart({
        mode: "test",
        authorizationUrl:
          "https://connect.stripe.com/oauth/authorize?client_id=ca_test_123&response_type=code&scope=read_write&redirect_uri=http%3A%2F%2Flocalhost%3A5182%2Fapi%2Fv1%2Fstripe-connect%2Foauth%2Fcallback&state=abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
      })
    ).toEqual({
      mode: "test",
      authorizationUrl:
        "https://connect.stripe.com/oauth/authorize?client_id=ca_test_123&response_type=code&scope=read_write&redirect_uri=http%3A%2F%2Flocalhost%3A5182%2Fapi%2Fv1%2Fstripe-connect%2Foauth%2Fcallback&state=abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
    })

    expect(
      parseStripeConnectStart({
        mode: "live",
        authorizationUrl: "https://attacker.example/oauth/authorize",
      })
    ).toBeNull()
  })
})
