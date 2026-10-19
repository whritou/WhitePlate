"use client"

import { useLocale, useTranslations } from "next-intl"
import {
  customerAddressLines,
  summarizeHours,
} from "@/lib/collection-presentation"
import { establishmentLinks } from "@/lib/establishment-links"
import type { PublicEstablishment } from "@/types/establishment-settings"

export function CollectionInformation({
  establishment,
  current = false,
  compact = false,
  customer = false,
  muted = false,
}: {
  establishment: PublicEstablishment
  current?: boolean
  compact?: boolean
  customer?: boolean
  muted?: boolean
}) {
  const t = useTranslations("CollectionInformation")
  const hours = useTranslations("OpeningHours")
  const locale = useLocale()
  const links = establishmentLinks(establishment)
  const lines = customerAddressLines(establishment, locale)

  if (customer)
    return (
      <div>
        <p className={muted ? "text-sm text-muted-foreground" : "text-sm"}>
          {lines.join(", ") || t("missingAddress")}
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {summarizeHours(
            establishment.openingHours,
            locale,
            hours("closed"),
            hours("notConfigured")
          )}
        </p>

        {establishment.pickupInstruction && (
          <p
            className="mt-4 text-sm"
            lang={establishment.pickupLocale ?? undefined}
          >
            {establishment.pickupInstruction}
          </p>
        )}
      </div>
    )

  if (compact)
    return (
      <section
        className="customer-collection-summary grid gap-px border-y border-border bg-border sm:grid-cols-3"
        aria-label={t("title")}
      >
        <div className="grid content-start gap-2 bg-background px-6 py-4">
          <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("addressLabel")}
          </h3>

          {lines.length > 0 ? (
            <address className="text-sm font-semibold not-italic">
              {lines.map((line, index) => (
                <span key={index} className="block">
                  {line}
                </span>
              ))}
            </address>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("missingAddress")}
            </p>
          )}
        </div>

        <div className="grid content-start gap-2 bg-background px-6 py-4">
          <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("hoursLabel")}
          </h3>

          <p className="text-sm font-semibold whitespace-pre-line">
            {summarizeHours(
              establishment.openingHours,
              locale,
              hours("closed"),
              hours("notConfigured")
            )}
          </p>

          {establishment.openingHours && (
            <p className="text-xs text-muted-foreground">
              {hours("localTime", { timeZone: establishment.timeZone })}
            </p>
          )}
        </div>

        <div className="grid content-start gap-2 bg-background px-6 py-4">
          <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("phoneLabel")}
          </h3>

          {links.phone ? (
            <a
              className="text-sm font-semibold underline underline-offset-4"
              href={links.phone}
            >
              {establishment.phone}
            </a>
          ) : (
            <p className="text-sm text-muted-foreground">{t("notProvided")}</p>
          )}
        </div>
      </section>
    )

  return (
    <section className="grid min-w-0 gap-3 break-words" aria-label={t("title")}>
      <h3 className="font-display text-lg font-bold">
        {t(current ? "currentTitle" : "title")}
      </h3>

      <p className="font-semibold">{establishment.name}</p>

      {current && (
        <p className="text-sm text-muted-foreground">{t("currentHelp")}</p>
      )}

      {lines.length > 0 ? (
        <address className="text-sm not-italic">
          {lines.map((line, index) => (
            <span key={index} className="block">
              {line}
            </span>
          ))}
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">{t("missingAddress")}</p>
      )}

      {establishment.pickupInstruction ? (
        <p
          lang={establishment.pickupLocale ?? undefined}
          className="text-sm whitespace-pre-wrap"
        >
          {establishment.pickupInstruction}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("missingInstructions")}
        </p>
      )}

      <div className="grid gap-2" aria-label={hours("title")}>
        <h4 className="font-semibold">{hours("title")}</h4>

        {!establishment.openingHours ? (
          <p className="text-sm text-muted-foreground">
            {hours("notConfigured")}
          </p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {hours("localTime", { timeZone: establishment.timeZone })}
            </p>

            <dl className="grid gap-1 text-sm">
              {establishment.openingHours.days.map((day, index) => {
                const weekday = new Intl.DateTimeFormat(locale, {
                  weekday: "long",
                  timeZone: "UTC",
                }).format(new Date(Date.UTC(2024, 0, index + 1)))
                const periods = day.isClosed
                  ? hours("closed")
                  : day.windows
                      .map((window) => `${window.start}–${window.end}`)
                      .join(", ")

                return (
                  <div
                    key={day.dayOfWeek}
                    className="flex justify-between gap-4"
                  >
                    <dt className="capitalize">{weekday}</dt>

                    <dd className="text-right">{periods}</dd>
                  </div>
                )
              })}
            </dl>
          </>
        )}
      </div>

      {links.phone && (
        <a
          className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
          href={links.phone}
        >
          {t("call", { phone: establishment.phone ?? "" })}
        </a>
      )}

      <div className="flex flex-wrap gap-3">
        {links.google && (
          <a
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {t("google")}
          </a>
        )}

        {links.waze && (
          <a
            className="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
            href={links.waze}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {t("waze")}
          </a>
        )}
      </div>
    </section>
  )
}
