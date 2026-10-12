"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { fetchPublicEstablishment } from "@/lib/api/establishment-browser"
import { Button } from "@/components/ui/button"
import { CollectionInformation } from "./collection-information"

export function CurrentCollectionInformation({ locale }: { locale: string }) {
  const t = useTranslations("CollectionInformation")
  const host = typeof window === "undefined" ? "" : window.location.host
  const query = useQuery({
    queryKey: ["public-establishment", host, locale],
    queryFn: ({ signal }) => fetchPublicEstablishment(locale, signal),
    retry: false,
    staleTime: 0,
  })

  return (
    <div className="mt-6 grid gap-3 border-t pt-6">
      {query.data && (
        <CollectionInformation establishment={query.data} current />
      )}

      {query.isPending ? (
        <p role="status" className="text-sm">
          {t("loading")}
        </p>
      ) : (
        query.error && (
          <div role="alert" className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t("unavailable")}</p>

            <Button
              type="button"
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        )
      )}
    </div>
  )
}
