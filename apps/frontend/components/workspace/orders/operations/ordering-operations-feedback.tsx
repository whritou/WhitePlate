"use client"

import type { ReactNode } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useOrderingOperationsController } from "./ordering-operations-controller"

export function OperationCopy({
  active,
  title,
  inactiveTitle,
  description,
  inactiveDescription,
  icon,
  inactiveIcon,
}: {
  active: boolean
  title: string
  inactiveTitle: string
  description: string
  inactiveDescription: string
  icon: ReactNode
  inactiveIcon: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {active ? icon : inactiveIcon}

      <div>
        <p className="font-medium">{active ? title : inactiveTitle}</p>

        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {active ? description : inactiveDescription}
        </p>
      </div>
    </div>
  )
}

export function OperationsFeedback({
  state,
  canManage,
  translations,
}: {
  state: ReturnType<typeof useOrderingOperationsController>["state"]
  canManage: boolean
  translations: {
    saved: string
    saving: string
    refreshing: string
    readOnly: string
    retry: string
    errors: Record<"conflict" | "forbidden" | "unavailable", string>
  }
}) {
  return (
    <>
      <p
        role="status"
        aria-live="polite"
        className="min-h-5 text-sm text-muted-foreground"
      >
        {state.isUpdating
          ? translations.saving
          : state.updateSucceeded
            ? translations.saved
            : state.isFetching
              ? translations.refreshing
              : null}
      </p>

      {state.updateError && (
        <FeedbackAlert
          message={
            translations.errors[
              state.updateError === "conflict" ||
              state.updateError === "forbidden"
                ? state.updateError
                : "unavailable"
            ]
          }
          retryLabel={translations.retry}
          onRetry={() => void state.retry()}
        />
      )}

      {state.loadError && (
        <FeedbackAlert
          message={translations.errors.unavailable}
          retryLabel={translations.retry}
          onRetry={() => void state.retry()}
          variant="warning"
        />
      )}

      {!canManage && (
        <p className="text-sm text-muted-foreground">{translations.readOnly}</p>
      )}
    </>
  )
}

export function FeedbackAlert({
  message,
  retryLabel,
  onRetry,
  variant = "destructive",
}: {
  message: string
  retryLabel: string
  onRetry: () => void
  variant?: "destructive" | "warning"
}) {
  return (
    <Alert variant={variant} role={variant === "warning" ? "status" : "alert"}>
      <AlertDescription>
        {message}

        <Button type="button" variant="link" className="ms-2" onClick={onRetry}>
          {retryLabel}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
