import { defineConfig } from "@playwright/test"
import nextEnv from "@next/env"

nextEnv.loadEnvConfig(process.cwd())

const baseURL = process.env.WHITEPLATE_ACCEPTANCE_URL ?? "http://localhost:3000"

if (new URL(baseURL).hostname !== "localhost")
  throw new Error("Browser acceptance runs only against localhost")

export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
})
