import { describe, expect, it } from "vitest"
import { createStoreFactory } from "./store-factory"

describe("createStoreFactory", () => {
  it("creates independent stores from caller-provided initial state", () => {
    type CounterState = { count: number; increment: () => void }

    const createCounterStore = createStoreFactory<number, CounterState>(
      (initialCount, set) => ({
        count: initialCount,
        increment: () => set((state) => ({ count: state.count + 1 })),
      })
    )

    const first = createCounterStore(2)
    const second = createCounterStore(8)

    first.getState().increment()

    expect(first.getState().count).toBe(3)
    expect(second.getState().count).toBe(8)
  })
})
