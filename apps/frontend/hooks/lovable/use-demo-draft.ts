"use client"
import { useMemo, useState, useSyncExternalStore } from "react"
import type { SetStateAction } from "react"

const subscribe = () => () => {}

const mounted = () => true
const server = () => false
const browserTime = typeof window === "undefined" ? 0 : Date.now()

export function useDemoHydrated() {
  return useSyncExternalStore(subscribe, mounted, server)
}

export function useDemoClock() {
  return useSyncExternalStore(
    subscribe,
    () => browserTime,
    () => 0
  )
}

export function useDemoDraft<T>(initial: T, read: () => T) {
  const hydrated = useDemoHydrated()
  const stored = useMemo(
    () => (hydrated ? read() : initial),
    [hydrated, initial, read]
  )
  const [draft, setDraft] = useState<{ value: T } | null>(null)
  const value = draft ? draft.value : stored
  const update = (next: SetStateAction<T>) =>
    setDraft((current) => ({
      value:
        typeof next === "function"
          ? (next as (previous: T) => T)(current ? current.value : stored)
          : next,
    }))

  return [value, update] as const
}
