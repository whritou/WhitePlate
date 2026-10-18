"use client"

import { CirclePause, CirclePlay, Clock3, Flame } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FeedbackAlert,
  OperationCopy,
  OperationsFeedback,
} from "./ordering-operations-feedback"
import { useOrderingOperationsController } from "./ordering-operations-controller"
import type {
  OrderingOperationsPresentation,
  OrderingOperationsStatusCounts,
} from "@/types/ordering-operations"

export function OrderingOperationsSummary({
  presentation = "card",
  counts,
}: {
  presentation?: OrderingOperationsPresentation
  counts?: OrderingOperationsStatusCounts
}) {
  const t = useTranslations("LiveWorkspace")
  const k = useTranslations("KitchenOrders")
  const { canManage, state, requestChange } = useOrderingOperationsController()
  const operations = state.operations

  if (state.isInitialLoading)
    return (
      <p role="status" className="py-4 text-sm text-muted-foreground">
        {t("orderingOperationsLoading")}
      </p>
    )

  if (!operations)
    return (
      <FeedbackAlert
        message={t("orderingOperationsErrors.unavailable")}
        retryLabel={t("retry")}
        onRetry={() => void state.retry()}
      />
    )

  if (presentation === "compact")
    return (
      <section
        aria-labelledby="ordering-operations-title"
        className="border-b py-4"
      >
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3
            id="ordering-operations-title"
            className="flex items-center gap-2 font-bold"
          >
            <CirclePlay aria-hidden="true" className="size-5" />

            {t("orderState")}
          </h3>

          <Badge variant={operations.acceptingOrders ? "success" : "warning"}>
            {operations.acceptingOrders
              ? t("ordersAccepting")
              : t("ordersPaused")}
          </Badge>
        </header>

        <ul className="mt-3 grid grid-cols-3 gap-2 border-b pb-3">
          {(["Pending", "Preparing", "Ready"] as const).map((status) => (
            <li key={status} className="min-w-0">
              <p className="text-xl font-bold tabular-nums">
                {counts?.[status] ?? "—"}
              </p>

              <p className="text-xs leading-4 text-muted-foreground">
                {k(`statuses.${status}`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap gap-2">
          {canManage ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              disabled={state.isUpdating}
              onClick={() =>
                requestChange(
                  operations.rushHoldEnabled ? "clearRush" : "enableRush"
                )
              }
            >
              {operations.rushHoldEnabled ? (
                <Flame aria-hidden="true" className="size-4" />
              ) : (
                <Clock3 aria-hidden="true" className="size-4" />
              )}

              {operations.rushHoldEnabled
                ? t("rushHoldActive", {
                    minutes: operations.rushBufferMinutes,
                  })
                : t("rushHoldOff")}
            </Button>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-1 border px-2 text-xs text-muted-foreground">
              <Clock3 aria-hidden="true" className="size-3" />

              {operations.rushHoldEnabled
                ? t("rushHoldActive", {
                    minutes: operations.rushBufferMinutes,
                  })
                : t("rushHoldOff")}
            </span>
          )}

          <span
            className={`inline-flex min-h-11 items-center gap-1 border px-2 text-xs ${operations.acceptingOrders ? "text-muted-foreground" : "text-destructive"}`}
          >
            <CirclePause aria-hidden="true" className="size-3" />

            {operations.acceptingOrders ? t("pauseOff") : t("pauseOn")}
          </span>
        </div>

        <OperationsFeedback
          state={state}
          canManage={canManage}
          translations={{
            saved: t("orderingOperationsSaved"),
            saving: t("orderingOperationsSaving"),
            refreshing: t("orderingOperationsRefreshing"),
            readOnly: t("orderingOperationsReadOnly"),
            retry: t("retry"),
            errors: {
              conflict: t("orderingOperationsErrors.conflict"),
              forbidden: t("orderingOperationsErrors.forbidden"),
              unavailable: t("orderingOperationsErrors.unavailable"),
            },
          }}
        />
      </section>
    )

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

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h3>{t("orderingServiceTitle")}</h3>
            </CardTitle>

            <Badge variant={operations.acceptingOrders ? "success" : "warning"}>
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
            <OperationCopy
              active={operations.acceptingOrders}
              title={t("ordersAccepting")}
              inactiveTitle={t("ordersPaused")}
              description={t("ordersAcceptingHelp")}
              inactiveDescription={t("ordersPausedHelp")}
              icon={<CirclePlay aria-hidden="true" className="mt-0.5 size-5" />}
              inactiveIcon={
                <CirclePause aria-hidden="true" className="mt-0.5 size-5" />
              }
            />

            {canManage && (
              <Button
                type="button"
                variant={operations.acceptingOrders ? "destructive" : "default"}
                disabled={state.isUpdating}
                onClick={() =>
                  requestChange(operations.acceptingOrders ? "pause" : "resume")
                }
              >
                {operations.acceptingOrders
                  ? t("pauseNewOrders")
                  : t("resumeNewOrders")}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 border-t pt-4">
            <OperationCopy
              active={operations.rushHoldEnabled}
              title={t("rushHoldTitle")}
              inactiveTitle={t("rushHoldTitle")}
              description={t("rushHoldEnabledHelp", {
                minutes: operations.rushBufferMinutes,
              })}
              inactiveDescription={t("rushHoldDisabledHelp", {
                minutes: operations.rushBufferMinutes,
              })}
              icon={
                <Flame aria-hidden="true" className="mt-0.5 size-5 text-info" />
              }
              inactiveIcon={
                <Clock3 aria-hidden="true" className="mt-0.5 size-5" />
              }
            />

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

          <OperationsFeedback
            state={state}
            canManage={canManage}
            translations={{
              saved: t("orderingOperationsSaved"),
              saving: t("orderingOperationsSaving"),
              refreshing: t("orderingOperationsRefreshing"),
              readOnly: t("orderingOperationsReadOnly"),
              retry: t("retry"),
              errors: {
                conflict: t("orderingOperationsErrors.conflict"),
                forbidden: t("orderingOperationsErrors.forbidden"),
                unavailable: t("orderingOperationsErrors.unavailable"),
              },
            }}
          />
        </CardContent>
      </Card>
    </section>
  )
}
