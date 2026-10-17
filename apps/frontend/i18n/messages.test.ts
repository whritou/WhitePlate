import { describe, expect, it } from "vitest"
import english from "@/messages/en.json"
import french from "@/messages/fr.json"

describe("LiveParity translations", () => {
  it("provides a version-tab label in English and French", () => {
    expect(english.LiveParity.versionsTab).toBe("Versions")
    expect(french.LiveParity.versionsTab).toBe("Versions")
  })
})
