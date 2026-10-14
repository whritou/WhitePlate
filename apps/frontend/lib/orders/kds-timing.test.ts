import { expect, it } from "vitest"
import {
  createKdsServerClock,
  formatKdsDuration,
  getOrderTiming,
  resolvePreparationNote,
} from "./kds-timing"

const order = {
  status: "Preparing" as const,
  createdAt: "2026-10-01T18:00:00.000Z",
  pickupAt: "2026-10-01T18:10:00.000Z",
}

it("derives elapsed and pickup countdowns from the supplied API clock", () => {
  expect(getOrderTiming(order, Date.parse("2026-10-01T18:04:20.000Z"))).toEqual(
    {
      elapsedSeconds: 260,
      pickupRemainingSeconds: 340,
      urgency: "onTrack",
    }
  )
})

it.each([
  ["2026-10-01T18:05:00.000Z", "dueSoon"],
  ["2026-10-01T18:10:00.000Z", "overdue"],
  ["2026-10-01T18:10:01.000Z", "overdue"],
])("marks pickup timing at the %s boundary as %s", (now, urgency) => {
  expect(getOrderTiming(order, Date.parse(now)).urgency).toBe(urgency)
})

it("keeps elapsed time when a legacy order has no pickup target", () => {
  expect(
    getOrderTiming(
      { ...order, pickupAt: null },
      Date.parse("2026-10-01T18:04:20.000Z")
    )
  ).toEqual({
    elapsedSeconds: 260,
    pickupRemainingSeconds: null,
    urgency: null,
  })
})

it("does not apply pickup urgency after an order reaches a terminal state", () => {
  expect(
    getOrderTiming(
      { ...order, status: "Completed" },
      Date.parse("2026-10-01T18:11:00.000Z")
    ).urgency
  ).toBeNull()
})

it("formats durations without relying on the browser wall clock", () => {
  expect(formatKdsDuration(61)).toBe("01:01")
  expect(formatKdsDuration(3661)).toBe("1:01:01")
  expect(formatKdsDuration(-61)).toBe("01:01")
})

it("advances the API clock from monotonic time after a response is received", () => {
  let monotonicTime = 125
  const readClock = createKdsServerClock(
    "2026-10-01T18:00:00.000Z",
    () => monotonicTime
  )

  monotonicTime += 5000
  expect(readClock()).toBe(Date.parse("2026-10-01T18:00:05.000Z"))
})

it("selects saved preparation notes in the order locale before the display locale", () => {
  expect(
    resolvePreparationNote(
      { en: "Finish last.", fr: "Terminer à la commande." },
      "fr-FR",
      "en"
    )
  ).toBe("Terminer à la commande.")
  expect(resolvePreparationNote({ en: "Finish last." }, null, "fr")).toBeNull()
})
