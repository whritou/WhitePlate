"use client"

import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { fetchPublicEstablishment } from "@/lib/api/establishment-browser"
import { Button } from "@/components/ui/button"
import { CollectionInformation } from "./collection-information"

export function CurrentCollectionInformation({
  locale,
  restaurantSlug,
  customer = false,
  muted = false,
}: {
  locale: string
  restaurantSlug?: string
  customer?: boolean
  muted?: boolean
}) {
  const t = useTranslations("CollectionInformation")
  const host = typeof window === "undefined" ? "" : window.location.host
  const query = useQuery({
    queryKey: ["public-establishment", host, locale, restaurantSlug],
    queryFn: ({ signal }) =>
      fetchPublicEstablishment(locale, signal, restaurantSlug),
    retry: false,
    staleTime: 0,
  })

  return (
    <div className={customer ? "mt-2" : "mt-6 grid gap-3 border-t pt-6"}>
      {query.data && (
        <CollectionInformation
          establishment={query.data}
          current={!customer}
          customer={customer}
          muted={muted}
        />
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
