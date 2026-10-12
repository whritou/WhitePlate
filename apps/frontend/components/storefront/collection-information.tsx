"use client"

import { useLocale, useTranslations } from "next-intl"
import { establishmentLinks } from "@/lib/establishment-links"
import type { PublicEstablishment } from "@/types/establishment-settings"

export function CollectionInformation({
  establishment,
  current = false,
}: {
  establishment: PublicEstablishment
  current?: boolean
}) {
  const t = useTranslations("CollectionInformation")
  const locale = useLocale()
  const countries = new Intl.DisplayNames([locale], { type: "region" })
  const links = establishmentLinks(establishment)
  const lines = [
    establishment.addressLine1,
    establishment.addressLine2,
    [establishment.postalCode, establishment.city].filter(Boolean).join(" "),
    establishment.region,
    establishment.countryCode ? countries.of(establishment.countryCode) : null,
  ].filter(Boolean)

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
