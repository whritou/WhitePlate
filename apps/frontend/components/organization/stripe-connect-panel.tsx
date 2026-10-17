"use client"

import { useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  getStripeConnectStatusAction,
  startStripeConnectOAuthAction,
} from "@/actions/stripe-connect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RestaurantRole } from "@/types/orders"
import type { StripeConnectStatus } from "@/types/stripe-connect"

const callbackOutcomes = [
  "connected",
  "canceled",
  "existing_account_required",
  "owner_required",
  "failed",
] as const

export function StripeConnectPanel({
  tenantId,
  role,
  initialStatus,
  callbackOutcome,
}: {
  tenantId: string
  role: RestaurantRole
  initialStatus: StripeConnectStatus | null
  callbackOutcome?: string
}) {
  const t = useTranslations("StripeConnect")
  const locale = useLocale() === "fr" ? "fr" : "en"
  const [status, setStatus] = useState(initialStatus)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(initialStatus === null)
  const isOwner = role === "OrganizationOwner"
  const canManage = isOwner && (status?.canManage ?? false)
  const callbackMessage = callbackOutcomes.includes(
    callbackOutcome as (typeof callbackOutcomes)[number]
  )
    ? t(`callback.${callbackOutcome as (typeof callbackOutcomes)[number]}`)
    : null

  function refreshStatus() {
    setError(null)
    startTransition(async () => {
      const result = await getStripeConnectStatusAction({ tenantId })

      if (result.ok && result.data) {
        setStatus(result.data)
        setUnavailable(false)
      } else {
        const reason = result.ok ? "unavailable" : result.error

        setStatus(null)
        setUnavailable(true)
        setError(reason === "not_found" ? "access" : "unavailable")
      }
    })
  }

  function connect() {
    setError(null)
    startTransition(async () => {
      const result = await startStripeConnectOAuthAction({ tenantId, locale })

      if (result.ok && result.data) {
        window.location.assign(result.data.authorizationUrl)

        return
      }

      const reason = result.ok ? "unavailable" : result.error

      setError(
        reason === "conflict"
          ? "alreadyConnected"
          : reason === "not_found" || reason === "forbidden"
            ? "access"
            : "unavailable"
      )
    })
  }

  const statusLabel = status
    ? t(`connection.${status.connectionState}`)
    : t("unavailable")
  const readinessLabel = status?.connectionState === "connected"
    ? t(`readiness.${status.readinessState}`)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>

        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {callbackMessage && (
          <Alert>
            <AlertDescription>{callbackMessage}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
          </Alert>
        )}

        <div
          className="grid gap-2 border p-4"
          role="status"
          aria-live="polite"
          aria-busy={pending}
        >
          <h3 className="font-semibold">{statusLabel}</h3>

          {readinessLabel && <p>{t("readinessLabel", { state: readinessLabel })}</p>}

          {status?.mode && (
            <p className="text-sm text-muted-foreground">
              {t("mode", { mode: t(`modes.${status.mode}`) })}
            </p>
          )}

          {status?.lastVerifiedAt ? (
            <p className="text-sm text-muted-foreground">
              {t("lastVerified", {
                date: new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                }).format(new Date(status.lastVerifiedAt)),
              })}
            </p>
          ) : status?.connectionState === "connected" ? (
            <p className="text-sm text-muted-foreground">{t("notVerifiedYet")}</p>
          ) : null}

          {unavailable && <p>{t("unavailableDescription")}</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          {canManage && status && status.connectionState !== "connected" && (
            <Button type="button" onClick={connect} disabled={pending}>
              {pending ? t("connecting") : t("connect")}
            </Button>
          )}

          {canManage && status?.dashboardUrl && (
            <Button
              nativeButton={false}
              role="link"
              variant="outline"
              render={
                <a href={status.dashboardUrl} target="_blank" rel="noreferrer" />
              }
            >
              {t("openDashboard")}
            </Button>
          )}

          <Button type="button" variant="outline" onClick={refreshStatus} disabled={pending}>
            {pending ? t("refreshing") : t("refresh")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
