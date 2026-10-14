import { expect, it, vi } from "vitest"
import { createKdsSoundController } from "./kds-sound"

it("requires a user enable action and stops alerts when muted", async () => {
  const oscillator = {
    type: "sine",
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }
  const context = {
    state: "suspended",
    currentTime: 2,
    destination: {},
    resume: vi.fn(async () => {
      context.state = "running"
    }),
    suspend: vi.fn(async () => {
      context.state = "suspended"
    }),
    close: vi.fn(async () => {
      context.state = "closed"
    }),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  }
  const controller = createKdsSoundController(
    () => context as unknown as AudioContext
  )

  expect(controller.alertNewOrder()).toBe(false)
  expect(await controller.enable()).toBe(true)
  expect(controller.alertNewOrder()).toBe(true)
  expect(oscillator.start).toHaveBeenCalledOnce()
  expect(oscillator.stop).toHaveBeenCalledOnce()

  controller.mute()
  expect(controller.alertNewOrder()).toBe(false)
  expect(context.suspend).toHaveBeenCalledOnce()
  controller.dispose()
  expect(context.close).toHaveBeenCalledOnce()
})

it("keeps sound disabled when the browser refuses audio activation", async () => {
  const context = {
    state: "suspended",
    resume: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
  }
  const controller = createKdsSoundController(
    () => context as unknown as AudioContext
  )

  expect(await controller.enable()).toBe(false)
  expect(controller.alertNewOrder()).toBe(false)
})
