"use client"

import { useEffect, useRef } from "react"

export function FixtureReady() {
  const marker = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    marker.current?.setAttribute("data-ready", "true")
  }, [])

  return (
    <span ref={marker} hidden data-testid="fixture-ready" data-ready="false" />
  )
}
