"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { saveEstablishmentSettingsAction } from "@/actions/establishment-settings"
import {
  fetchEstablishmentSettings,
  EstablishmentRequestError,
} from "@/lib/api/establishment-browser"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { EstablishmentEditorProps } from "@/types/establishment-settings"
import { EstablishmentForm } from "./establishment-form"

export function EstablishmentEditor({
  tenantId,
  userId,
  initial,
}: EstablishmentEditorProps) {
  const t = useTranslations("EstablishmentSettings")
  const locale = useLocale()
  const cache = useQueryClient()
  const router = useRouter()
  const [lostAccess, setLostAccess] = useState(false)
  const queryKey = ["establishment-settings", userId, tenantId, locale]
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      try {
        return await fetchEstablishmentSettings(tenantId, signal)
      } catch (error) {
        if (
          error instanceof EstablishmentRequestError &&
          ["unauthorized", "forbidden", "not_found"].includes(error.code)
        )
          clearAccess()
        throw error
      }
    },
    initialData: initial ?? undefined,
    staleTime: 0,
    retry: false,
    enabled: !lostAccess,
  })
  const denied =
    lostAccess ||
    (query.error instanceof EstablishmentRequestError &&
      ["unauthorized", "forbidden", "not_found"].includes(query.error.code))

  function clearAccess() {
    setLostAccess(true)
    cache.removeQueries({
      queryKey: ["establishment-settings", userId, tenantId],
    })
  }

  if (denied)
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>{t("accessLost")}</AlertDescription>
      </Alert>
    )
  if (query.isPending)
    return (
      <div role="status" className="grid gap-4">
        <p>{t("loading")}</p>

        <Skeleton className="h-12 w-full" />

        <Skeleton className="h-48 w-full" />
      </div>
    )
  if (!query.data)
    return (
      <Alert role="alert">
        <AlertDescription>{t("errors.unavailable")}</AlertDescription>

        <Button
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
        >
          {t("retry")}
        </Button>
      </Alert>
    )

  return (
    <div className="grid gap-4">
      {query.error && (
        <Alert role="alert">
          <AlertDescription>{t("refreshError")}</AlertDescription>

          <Button
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t("retry")}
          </Button>
        </Alert>
      )}

      <EstablishmentForm
        key={`${userId}:${tenantId}:${locale}`}
        tenantId={tenantId}
        value={query.data}
        save={saveEstablishmentSettingsAction}
        onSaved={async (settings) => {
          await cache.cancelQueries({ queryKey })
          cache.setQueryData(queryKey, { ...query.data, settings })
          router.refresh()
        }}
        onAccessLost={clearAccess}
        reload={async () => {
          const fresh = await query.refetch()

          return fresh.data && !fresh.error ? fresh.data : null
        }}
      />
    </div>
  )
}
