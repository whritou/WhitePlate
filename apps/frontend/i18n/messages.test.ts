import { describe, expect, it } from "vitest"
import english from "@/messages/en.json"
import french from "@/messages/fr.json"

describe("LiveParity translations", () => {
  it("provides a version-tab label in English and French", () => {
    expect(english.LiveParity.versionsTab).toBe("Versions")
    expect(french.LiveParity.versionsTab).toBe("Versions")
  })

  it("provides matching Stripe Connect copy for English and French", () => {
    const englishStripe = english.StripeConnect
    const frenchStripe = french.StripeConnect

    expect(Object.keys(frenchStripe).sort()).toEqual(
      Object.keys(englishStripe).sort()
    )
    expect(Object.keys(frenchStripe.connection).sort()).toEqual(
      Object.keys(englishStripe.connection).sort()
    )
    expect(Object.keys(frenchStripe.readiness).sort()).toEqual(
      Object.keys(englishStripe.readiness).sort()
    )
    expect(Object.keys(frenchStripe.callback).sort()).toEqual(
      Object.keys(englishStripe.callback).sort()
    )
  })
})
