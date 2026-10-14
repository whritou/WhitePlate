"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createKdsSoundController } from "@/lib/orders/kds-sound"
import type { KdsSoundState } from "@/types/kds"

export function useKdsSound() {
  const [state, setState] = useState<KdsSoundState>("muted")
  const controller = useRef<ReturnType<typeof createKdsSoundController> | null>(
    null
  )

  const enable = useCallback(async () => {
    try {
      if (!controller.current) {
        controller.current = createKdsSoundController(() => {
          if (typeof window.AudioContext !== "function")
            throw new Error("Audio is unavailable")

          return new window.AudioContext()
        })
      }

      setState((await controller.current.enable()) ? "enabled" : "unavailable")
    } catch {
      setState("unavailable")
    }
  }, [])

  const mute = useCallback(() => {
    controller.current?.mute()
    setState("muted")
  }, [])

  const alertNewOrder = useCallback(() => {
    controller.current?.alertNewOrder()
  }, [])

  useEffect(
    () => () => {
      controller.current?.dispose()
    },
    []
  )

  return { state, enable, mute, alertNewOrder }
}
