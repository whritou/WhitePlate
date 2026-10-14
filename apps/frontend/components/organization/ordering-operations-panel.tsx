"use client"

import { CirclePause, CirclePlay } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  OrderingOperationsController,
  useOrderingOperationsController,
} from "./ordering-operations-controller"
import { OrderingOperationsSummary } from "./ordering-operations-summary"
import type { OrderingOperationsControllerProps } from "@/types/ordering-operations"

export { OrderingOperationsSummary }

export function OrderingOperationsPanel(
  props: OrderingOperationsControllerProps
) {
  return (
    <OrderingOperationsController {...props}>
      <OrderingOperationsSummary presentation="card" />
    </OrderingOperationsController>
  )
}

export function OrderingOperationsPauseAction() {
  const t = useTranslations("LiveWorkspace")
  const { role, state, requestChange } = useOrderingOperationsController()
  const operations = state.operations

  if (role === "Kitchen" || !operations) return null

  return (
    <Button
      type="button"
      variant={operations.acceptingOrders ? "outline" : "destructive"}
      className="min-h-11 md:min-h-12"
      disabled={state.isUpdating}
      onClick={() =>
        requestChange(operations.acceptingOrders ? "pause" : "resume")
      }
    >
      {operations.acceptingOrders ? (
        <CirclePause aria-hidden="true" />
      ) : (
        <CirclePlay aria-hidden="true" />
      )}

      {operations.acceptingOrders ? t("pauseNewOrders") : t("resumeNewOrders")}
    </Button>
  )
}
