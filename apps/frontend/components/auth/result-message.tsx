"use client"

import type { ActionState } from "@/types/organization"

export function ResultMessage({
  state,
  message,
}: {
  state: ActionState
  message: string
}) {
  if (state.status === "idle" || state.status === "pending") return null
  return (
    <p
      role={state.status === "success" ? "status" : "alert"}
      className={`rounded-lg border px-3 py-2 text-sm ${state.status === "success" ? "border-primary/20 bg-primary/5 text-foreground" : "border-destructive/30 bg-destructive/5 text-destructive"}`}
    >
      {message}
    </p>
  )
}
