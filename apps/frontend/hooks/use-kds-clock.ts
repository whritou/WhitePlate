"use client"

import { useEffect, useState } from "react"
import { createKdsServerClock } from "@/lib/orders/kds-timing"

export function useKdsClock(serverTime: string | null): number {
  const [now, setNow] = useState(() =>
    serverTime ? Date.parse(serverTime) : 0
  )

  useEffect(() => {
    if (!serverTime) return

    const readServerTime = createKdsServerClock(serverTime, () =>
      performance.now()
    )

    const interval = window.setInterval(() => setNow(readServerTime()), 1000)

    return () => window.clearInterval(interval)
  }, [serverTime])

  return now
}
