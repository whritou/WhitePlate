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
  section = "establishment",
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
      <div
        aria-busy="true"
        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="grid content-start gap-6 border bg-background p-4 sm:p-6">
          <p role="status" aria-live="polite" className="sr-only">
            {t("loading")}
          </p>

          {section === "hours" ? (
            <div className="grid gap-3">
              {Array.from({ length: 7 }, (_, index) => (
                <div
                  key={index}
                  className="grid items-center gap-3 border-b pb-3 sm:grid-cols-[minmax(8rem,1fr)_minmax(0,2fr)]"
                >
                  <Skeleton className="h-5 w-24 rounded-none" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-11 w-full rounded-none" />
                    <Skeleton className="h-11 w-full rounded-none" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-11 w-40 rounded-none" />
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="grid gap-2">
                    <Skeleton className="h-4 w-32 max-w-full rounded-none" />
                    <Skeleton className="h-12 w-full rounded-none" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 border-t pt-5">
                <Skeleton className="h-12 w-32 rounded-none" />
                <Skeleton className="h-12 w-28 rounded-none" />
              </div>
            </>
          )}
        </div>

        {section === "establishment" && (
          <aside className="grid h-fit gap-3 border p-4 sm:p-6">
            <Skeleton className="h-7 w-36 rounded-none" />
            <Skeleton className="h-4 w-full rounded-none" />
            <Skeleton className="h-4 w-4/5 rounded-none" />
            <Skeleton className="mt-2 h-28 w-full rounded-none" />
          </aside>
        )}
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
        section={section}
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
