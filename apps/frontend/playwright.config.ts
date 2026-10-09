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
  projects: [
    {
      name: "product-photos",
      testMatch: ["product-photos.spec.ts", "product-photo-guest.spec.ts"],
    },
    { name: "brand-assets", testMatch: "brand-assets.spec.ts" },
    {
      name: "menu-builder",
      testMatch: ["menu-builder.spec.ts", "menu-manager.spec.ts"],
    },
    {
      name: "responsive-layout",
      testMatch: ["responsive-layout.spec.ts", "public-responsive.spec.ts"],
    },
    {
      name: "catalog-design",
      testMatch: ["catalog-design.spec.ts", "catalog-design-save.spec.ts"],
    },
    { name: "orders-kanban", testMatch: "orders-kanban.spec.ts" },
    { name: "order-history", testMatch: "order-history.spec.ts" },
    { name: "workspace-locale", testMatch: "workspace-locale.spec.ts" },
    { name: "design-system", testMatch: "design-system.spec.ts" },
    { name: "workspace-toasts", testMatch: "workspace-toast.spec.ts" },
    { name: "restaurant", testMatch: "restaurant-creation.spec.ts" },
    {
      name: "catalog",
      testMatch: ["catalog-management.spec.ts", "discount-management.spec.ts"],
      dependencies: ["restaurant"],
    },
    {
      name: "staff",
      testMatch: "staff-dashboard.spec.ts",
      dependencies: ["catalog"],
    },
    {
      name: "realtime",
      testMatch: "order-realtime.spec.ts",
      dependencies: ["catalog"],
    },
  ],
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
})
