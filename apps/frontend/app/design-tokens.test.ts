import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const canonical = JSON.parse(
  readFileSync(
    new URL("../../../docs/design-system/tokens.json", import.meta.url),
    "utf8"
  )
)
const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8")

describe("canonical WhitePlate design tokens", () => {
  for (const [theme, selector] of [["light", ":root"]]) {
    it(`keeps every ${theme} runtime color aligned with the design reference`, () => {
      const body = css.match(
        new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]+)\\}`)
      )?.[1]

      expect(body).toBeDefined()

      const colors = Object.fromEntries(
        Array.from(
          body!.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g),
          (match) => [match[1], match[2].toUpperCase()]
        )
      )

      expect(colors).toEqual(canonical.themes[theme])
    })
  }

  it("keeps runtime appearance light-only", () => {
    expect(canonical.runtimeThemes).toEqual(["light"])
    expect(css).not.toMatch(/\.dark\s*\{|prefers-color-scheme:\s*dark/)
  })

  it("keeps control, card and overlay radii aligned with the reference", () => {
    for (const role of ["sm", "md", "lg", "xl"]) {
      expect(css).toContain(
        `--radius-${role}: ${canonical.radiusRem[role]}rem;`
      )
    }
  })
})
