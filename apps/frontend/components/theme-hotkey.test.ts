import { describe, expect, it } from "vitest"
import { isThemeShortcutKey } from "./theme-hotkey"

describe("theme shortcut key", () => {
  it("ignores a keydown event with no key", () => {
    expect(isThemeShortcutKey(undefined)).toBe(false)
  })

  it("recognizes d regardless of case", () => {
    expect(isThemeShortcutKey("d")).toBe(true)
    expect(isThemeShortcutKey("D")).toBe(true)
  })
})
