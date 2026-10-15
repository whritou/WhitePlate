import { describe, expect, it } from "vitest"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import {
  parseThemeAppearance,
  parseThemeDraft,
  themeAppearance,
  themeContrast,
} from "./theme-appearance"

describe("tenant appearance boundary", () => {
  it("retains all editable appearance fields without copying identity, image or domain data", () => {
    const theme = themeAppearance({
      ...DEFAULT_THEME,
      font: "Playfair Display",
      radius: 24,
    })

    expect(theme.font).toBe("Playfair Display")
    expect(theme.radius).toBe(24)
    expect(theme).not.toHaveProperty("logo")
    expect(theme).not.toHaveProperty("name")
    expect(theme).not.toHaveProperty("domain")
    expect(parseThemeDraft({ theme, version: 7 })?.version).toBe(7)
  })

  it.each([
    { primary: "url(https://foreign.test)" },
    { font: "Unknown" },
    { radius: -1 },
    { headingWeight: 1000 },
    { lineHeight: NaN },
    { bannerOverlay: 100 },
    { ambiance: "unknown" },
    { logo: "data:image/svg+xml,evil" },
  ])("rejects unsafe, unbounded and nonappearance data %j", (patch) => {
    expect(
      parseThemeAppearance({ ...themeAppearance(DEFAULT_THEME), ...patch })
    ).toBeNull()
  })

  it("calculates actual ratios and identifies an unreadable draft", () => {
    const contrast = themeContrast({
      primary: "#000000",
      accent: "#ffffff",
      bg: "#ffffff",
      text: "#000000",
    })

    expect(contrast.textOnBackground).toBe(21)
    expect(contrast.readyForPublication).toBe(true)
    expect(
      themeContrast({
        primary: "#ffffff",
        accent: "#ffffff",
        bg: "#ffffff",
        text: "#ffffff",
      }).readyForPublication
    ).toBe(false)
  })
})
