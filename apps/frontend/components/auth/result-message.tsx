"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"

import type { ActionState } from "@/types/organization"

export function ResultMessage({
  state,
  message,
  hideSuccess = false,
}: {
  state: ActionState
  message: string
  hideSuccess?: boolean
}) {
  if (
    state.status === "idle" ||
    state.status === "pending" ||
    (hideSuccess && state.status === "success")
  )
    return null

  return (
    <Alert
      role={state.status === "success" ? "status" : "alert"}
      variant={state.status === "success" ? "success" : "destructive"}
    >
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
