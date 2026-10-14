import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import { OrderingOperationsPanel } from "./ordering-operations-panel"

const { operationsState } = vi.hoisted(() => ({
  operationsState: { value: {} as Record<string, unknown> },
}))

vi.mock("@/hooks/use-ordering-operations", () => ({
  useOrderingOperations: () => operationsState.value,
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
}))

beforeEach(() => {
  operationsState.value = {
    operations: {
      acceptingOrders: true,
      rushHoldEnabled: true,
      rushBufferMinutes: 10,
      version: 1,
    },
    loadError: null,
    updateError: null,
    isInitialLoading: false,
    isFetching: false,
    isUpdating: false,
    updateSucceeded: false,
    retry: vi.fn(),
    update: vi.fn(),
    clearUpdateFeedback: vi.fn(),
  }
})

it("shows live ordering status and controls to a manager", () => {
  const html = renderToStaticMarkup(
    createElement(OrderingOperationsPanel, {
      userId: "manager",
      tenantId: "22222222-2222-4222-8222-222222222222",
      locale: "en",
      role: "Manager",
      initialOperations: null,
    })
  )

  expect(html).toContain("ordersAccepting")
  expect(html).toContain("rushHoldActive 10")
  expect(html).toContain("pauseNewOrders")
  expect(html).toContain("clearRushHold")
  expect(html).not.toContain("orderingOperationsReadOnly")
})

it("shows current status to Kitchen without mutation controls", () => {
  const html = renderToStaticMarkup(
    createElement(OrderingOperationsPanel, {
      userId: "kitchen",
      tenantId: "22222222-2222-4222-8222-222222222222",
      locale: "fr",
      role: "Kitchen",
      initialOperations: null,
    })
  )

  expect(html).toContain("ordersAccepting")
  expect(html).toContain("orderingOperationsReadOnly")
  expect(html).not.toContain("pauseNewOrders")
  expect(html).not.toContain("clearRushHold")
})
