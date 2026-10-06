import { afterEach, expect, it, vi } from "vitest"
import { requireAcceptanceDatabase } from "./browser/acceptance-environment"

afterEach(() => vi.unstubAllEnvs())

it("requires the explicit non-production Neon test database opt-in", () => {
  vi.stubEnv("WHITEPLATE_ACCEPTANCE_DATABASE", "")
  vi.stubEnv("DATABASE_URL", "postgres://ep-test.neon.tech/neondb")
  vi.stubEnv("NODE_ENV", "test")

  expect(() => requireAcceptanceDatabase()).toThrow(
    "Explicitly select WHITEPLATE_ACCEPTANCE_DATABASE=neon-test for test-only fixture mutations"
  )
})

it("accepts a configured Neon test database only outside production", () => {
  vi.stubEnv("WHITEPLATE_ACCEPTANCE_DATABASE", "neon-test")
  vi.stubEnv("DATABASE_URL", "postgres://ep-test.neon.tech/neondb")
  vi.stubEnv("NODE_ENV", "test")

  expect(() => requireAcceptanceDatabase()).not.toThrow()
})

it("rejects acceptance mutations in a production environment", () => {
  vi.stubEnv("WHITEPLATE_ACCEPTANCE_DATABASE", "neon-test")
  vi.stubEnv("DATABASE_URL", "postgres://ep-test.neon.tech/neondb")
  vi.stubEnv("NODE_ENV", "production")

  expect(() => requireAcceptanceDatabase()).toThrow(
    "Explicitly select WHITEPLATE_ACCEPTANCE_DATABASE=neon-test for test-only fixture mutations"
  )
})
