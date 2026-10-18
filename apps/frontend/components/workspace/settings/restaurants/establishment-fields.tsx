"use client"

import { useLocale, useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type {
  EstablishmentFieldsProps,
  EstablishmentTextField,
} from "@/types/establishment-settings"

const identity: EstablishmentTextField[] = [
  { key: "name", max: 200, required: true },
  { key: "phone", max: 40, type: "tel" },
]
const address: EstablishmentTextField[] = [
  { key: "addressLine1", max: 200 },
  { key: "addressLine2", max: 200 },
  { key: "postalCode", max: 20 },
  { key: "city", max: 100 },
  { key: "region", max: 100 },
  { key: "latitude", max: 32 },
  { key: "longitude", max: 32 },
]

export function EstablishmentFields({
  draft,
  options,
  locales,
  defaultLocale,
  errors,
  change,
}: EstablishmentFieldsProps) {
  const t = useTranslations("EstablishmentSettings")
  const locale = useLocale()
  const countries = new Intl.DisplayNames([locale], { type: "region" })
  const textField = ({ key, max, required, type }: EstablishmentTextField) => (
    <div key={key} className="grid min-w-0 content-start gap-2">
      <Label htmlFor={`est-${key}`}>
        {t(key)} {required && <span aria-hidden="true">*</span>}
      </Label>

      <Input
        id={`est-${key}`}
        name={key}
        type={type ?? "text"}
        maxLength={max}
        required={required}
        value={draft[key]}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `est-${key}-error` : undefined}
        inputMode={
          key === "latitude" || key === "longitude" ? "decimal" : undefined
        }
        onChange={(event) => change({ ...draft, [key]: event.target.value })}
      />

      {errors[key] && (
        <p id={`est-${key}-error`} className="text-sm text-destructive">
          {t("fieldError")}
        </p>
      )}
    </div>
  )

  return (
    <div className="grid gap-8">
      <section className="grid gap-4" aria-labelledby="identity-heading">
        <h2 id="identity-heading" className="font-display text-xl font-bold">
          {t("identity")}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {identity.map(textField)}
        </div>
      </section>

      <section
        className="grid gap-4 border-t pt-6"
        aria-labelledby="address-heading"
      >
        <h2 id="address-heading" className="font-display text-xl font-bold">
          {t("address")}
        </h2>

        <p className="text-sm text-muted-foreground">{t("addressHelp")}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {address.map(textField)}

          <div className="grid content-start gap-2">
            <Label htmlFor="est-countryCode">{t("countryCode")}</Label>

            <NativeSelect
              id="est-countryCode"
              value={draft.countryCode}
              aria-invalid={!!errors.countryCode}
              aria-describedby={
                errors.countryCode ? "est-countryCode-error" : undefined
              }
              onChange={(event) =>
                change({ ...draft, countryCode: event.target.value })
              }
            >
              <NativeSelectOption value="">{t("none")}</NativeSelectOption>

              {options.countries.map((code) => (
                <NativeSelectOption key={code} value={code}>
                  {countries.of(code) ?? code}
                </NativeSelectOption>
              ))}
            </NativeSelect>

            {errors.countryCode && (
              <p
                id="est-countryCode-error"
                className="text-sm text-destructive"
              >
                {t("fieldError")}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{t("coordinatesHelp")}</p>
      </section>

      <section
        className="grid gap-4 border-t pt-6"
        aria-labelledby="pickup-heading"
      >
        <h2 id="pickup-heading" className="font-display text-xl font-bold">
          {t("pickup")}
        </h2>

        <Label htmlFor="est-timeZone">
          {t("timeZone")} <span aria-hidden="true">*</span>
        </Label>

        <NativeSelect
          id="est-timeZone"
          required
          value={draft.timeZone}
          aria-invalid={!!errors.timeZone}
          onChange={(event) =>
            change({ ...draft, timeZone: event.target.value })
          }
        >
          {options.timeZones.map((zone) => (
            <NativeSelectOption key={zone} value={zone}>
              {zone}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <p className="text-sm text-muted-foreground">{t("timeZoneHelp")}</p>

        <p className="text-sm text-muted-foreground">
          {t("pickupHelp", { locale: defaultLocale })}
        </p>

        {locales.map((language) => (
          <div key={language} className="grid gap-2">
            <Label htmlFor={`pickup-${language}`}>
              {t("pickupLanguage", { locale: language })}
            </Label>

            <Textarea
              id={`pickup-${language}`}
              rows={3}
              maxLength={1000}
              value={draft.pickupInstructions[language] ?? ""}
              aria-invalid={!!errors[`pickup-${language}`]}
              aria-describedby={
                errors[`pickup-${language}`]
                  ? `pickup-${language}-error`
                  : undefined
              }
              onChange={(event) =>
                change({
                  ...draft,
                  pickupInstructions: {
                    ...draft.pickupInstructions,
                    [language]: event.target.value,
                  },
                })
              }
            />

            {errors[`pickup-${language}`] && (
              <p
                id={`pickup-${language}-error`}
                className="text-sm text-destructive"
              >
                {t("fieldError")}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
