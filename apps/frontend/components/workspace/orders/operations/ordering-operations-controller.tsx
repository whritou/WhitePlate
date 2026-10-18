"use client"

import { createContext, useContext, useState } from "react"
import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useOrderingOperations } from "@/hooks/use-ordering-operations"
import type {
  OrderingOperationsControllerValue,
  OrderingOperationsControllerProps,
  RequestedOrderingOperationsChange,
} from "@/types/ordering-operations"

const OrderingOperationsContext =
  createContext<OrderingOperationsControllerValue | null>(null)

export function OrderingOperationsController({
  children,
  ...scope
}: OrderingOperationsControllerProps) {
  const t = useTranslations("LiveWorkspace")
  const state = useOrderingOperations(scope)
  const [requestedChange, setRequestedChange] =
    useState<RequestedOrderingOperationsChange>(null)
  const operations = state.operations

  function requestChange(
    kind: NonNullable<RequestedOrderingOperationsChange>["kind"]
  ) {
    if (!operations || !scope.permissions.includes("orders.manage")) return
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

  const value: OrderingOperationsControllerValue = {
    role: scope.role,
    canManage: scope.permissions.includes("orders.manage"),
    requestedChange,
    state,
    requestChange,
    confirmChange,
    closeChange: () => setRequestedChange(null),
  }

  return (
    <OrderingOperationsContext.Provider value={value}>
      {children}

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
    </OrderingOperationsContext.Provider>
  )
}

export function useOrderingOperationsController() {
  const value = useContext(OrderingOperationsContext)

  if (!value)
    throw new Error(
      "Ordering operations controls must be inside OrderingOperationsController"
    )

  return value
}
