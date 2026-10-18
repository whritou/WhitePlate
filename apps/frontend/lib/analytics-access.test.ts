import { expect, it } from "vitest"
import { selectAnalyticsMemberships } from "./analytics-access"

it("authorizes analytics by persisted permission rather than legacy role name", () => {
  const restaurantMemberships = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      role: "Accountant",
      permissions: ["analytics.view", "billing.manage"],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      role: "custom-kitchen",
      permissions: ["kitchen.display"],
    },
  ]

  expect(selectAnalyticsMemberships(restaurantMemberships)).toEqual([
    restaurantMemberships[0],
  ])
})
