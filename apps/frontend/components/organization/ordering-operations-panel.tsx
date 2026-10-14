"use client"

import { useState } from "react"
import { CirclePause, CirclePlay, Clock3, Flame } from "lucide-react"
import { useTranslations } from "next-intl"
import { useOrderingOperations } from "@/hooks/use-ordering-operations"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RestaurantRole } from "@/types/orders"
import type {
  OrderingOperations,
  RequestedOrderingOperationsChange,
} from "@/types/ordering-operations"

export function OrderingOperationsPanel({
  userId,
  tenantId,
  locale,
  role,
  initialOperations,
}: {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
  initialOperations: OrderingOperations | null
}) {
  const t = useTranslations("LiveWorkspace")
  const state = useOrderingOperations({
    userId,
    tenantId,
    locale,
    role,
    initialOperations,
  })
  const [requestedChange, setRequestedChange] =
    useState<RequestedOrderingOperationsChange>(null)
  const operations = state.operations
  const canManage = role === "OrganizationOwner" || role === "Manager"

  function requestChange(
    kind: NonNullable<RequestedOrderingOperationsChange>["kind"]
  ) {
    if (!operations) return
    state.clearUpdateFeedback()
    setRequestedChange({
      kind,
      acceptingOrders:
        kind === "pause"
          ? false
          : kind === "resume"
            ? true
            : operations.acceptingOrders,
      rushHoldEnabled:
        kind === "enableRush"
          ? true
          : kind === "clearRush"
            ? false
            : operations.rushHoldEnabled,
    })
  }

  async function confirmChange() {
    if (!requestedChange) return
    try {
      await state.update({
        acceptingOrders: requestedChange.acceptingOrders,
        rushHoldEnabled: requestedChange.rushHoldEnabled,
      })
      setRequestedChange(null)
    } catch {
      setRequestedChange(null)
    }
  }

  return (
    <section
      aria-labelledby="ordering-operations-title"
      className="grid min-w-0 gap-4 border-t pt-7"
    >
      <header>
        <h2
          id="ordering-operations-title"
          className="font-display text-2xl font-bold"
        >
          {t("orderingOperationsTitle")}
        </h2>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("orderingOperationsHelp")}
        </p>
      </header>

      {state.isInitialLoading ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("orderingOperationsLoading")}
        </p>
      ) : operations ? (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>
                <h3>{t("orderingServiceTitle")}</h3>
              </CardTitle>

              <Badge
                variant={operations.acceptingOrders ? "success" : "warning"}
              >
                {operations.acceptingOrders
                  ? t("ordersAccepting")
                  : t("ordersPaused")}
              </Badge>

              {operations.rushHoldEnabled && (
                <Badge variant="info">
                  {t("rushHoldActive", {
                    minutes: operations.rushBufferMinutes,
                  })}
                </Badge>
              )}
            </div>

            <CardDescription>{t("orderingServiceDescription")}</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {operations.acceptingOrders ? (
                  <CirclePlay
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-success"
                  />
                ) : (
                  <CirclePause
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-warning"
                  />
                )}

                <div>
                  <p className="font-medium">
                    {operations.acceptingOrders
                      ? t("ordersAccepting")
                      : t("ordersPaused")}
                  </p>

                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {operations.acceptingOrders
                      ? t("ordersAcceptingHelp")
                      : t("ordersPausedHelp")}
                  </p>
                </div>
              </div>

              {canManage && (
                <Button
                  type="button"
                  variant={
                    operations.acceptingOrders ? "destructive" : "default"
                  }
                  disabled={state.isUpdating}
                  onClick={() =>
                    requestChange(
                      operations.acceptingOrders ? "pause" : "resume"
                    )
                  }
                >
                  {operations.acceptingOrders
                    ? t("pauseNewOrders")
                    : t("resumeNewOrders")}
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 border-t pt-4">
              <div className="flex min-w-0 items-start gap-3">
                {operations.rushHoldEnabled ? (
                  <Flame
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-info"
                  />
                ) : (
                  <Clock3
                    aria-hidden="true"
                    className="mt-0.5 size-5 text-muted-foreground"
                  />
                )}

                <div>
                  <p className="font-medium">{t("rushHoldTitle")}</p>

                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    {operations.rushHoldEnabled
                      ? t("rushHoldEnabledHelp", {
                          minutes: operations.rushBufferMinutes,
                        })
                      : t("rushHoldDisabledHelp", {
                          minutes: operations.rushBufferMinutes,
                        })}
                  </p>
                </div>
              </div>

              {canManage && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={state.isUpdating}
                  onClick={() =>
                    requestChange(
                      operations.rushHoldEnabled ? "clearRush" : "enableRush"
                    )
                  }
                >
                  {operations.rushHoldEnabled
                    ? t("clearRushHold")
                    : t("enableRushHold")}
                </Button>
              )}
            </div>

            <p
              role="status"
              aria-live="polite"
              className="min-h-5 text-sm text-muted-foreground"
            >
              {state.isUpdating
                ? t("orderingOperationsSaving")
                : state.updateSucceeded
                  ? t("orderingOperationsSaved")
                  : state.isFetching
                    ? t("orderingOperationsRefreshing")
                    : null}
            </p>

            {state.updateError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  {state.updateError === "conflict"
                    ? t("orderingOperationsErrors.conflict")
                    : state.updateError === "forbidden"
                      ? t("orderingOperationsErrors.forbidden")
                      : t("orderingOperationsErrors.unavailable")}

                  <Button
                    type="button"
                    variant="link"
                    className="ms-2"
                    onClick={() => void state.retry()}
                  >
                    {t("retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {state.loadError && (
              <Alert variant="warning" role="status">
                <AlertDescription>
                  {t("orderingOperationsErrors.unavailable")}

                  <Button
                    type="button"
                    variant="link"
                    className="ms-2"
                    onClick={() => void state.retry()}
                  >
                    {t("retry")}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {!canManage && (
              <p className="text-sm text-muted-foreground">
                {t("orderingOperationsReadOnly")}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t("orderingOperationsErrors.unavailable")}

            <Button
              type="button"
              variant="link"
              className="ms-2"
              onClick={() => void state.retry()}
            >
              {t("retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <AlertDialog
        open={requestedChange !== null}
        onOpenChange={(open) => !open && setRequestedChange(null)}
      >
        <AlertDialogPortal>
          <AlertDialogBackdrop />

          <AlertDialogPopup>
            <AlertDialogTitle>
              {requestedChange
                ? t(`orderingOperationsConfirm.${requestedChange.kind}.title`)
                : ""}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {requestedChange
                ? t(
                    `orderingOperationsConfirm.${requestedChange.kind}.description`,
                    { minutes: operations?.rushBufferMinutes ?? 10 }
                  )
                : ""}
            </AlertDialogDescription>

            <div className="flex flex-wrap justify-end gap-2">
              <AlertDialogClose
                render={
                  <Button type="button" variant="outline">
                    {t("cancel")}
                  </Button>
                }
              />

              <Button
                type="button"
                variant={
                  requestedChange?.kind === "pause" ? "destructive" : "default"
                }
                disabled={state.isUpdating}
                onClick={() => void confirmChange()}
              >
                {state.isUpdating
                  ? t("orderingOperationsSaving")
                  : t("confirmChange")}
              </Button>
            </div>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>
    </section>
  )
}
