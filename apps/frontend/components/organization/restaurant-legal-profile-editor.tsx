"use client"

import { saveTenantLegalProfileAction } from "@/actions/establishment-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { TenantLegalProfile } from "@/types/establishment-settings"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition, type FormEvent } from "react"

export function RestaurantLegalProfileEditor({
  tenantId,
  initial,
}: {
  tenantId: string
  initial: TenantLegalProfile | null
}) {
  const t = useTranslations("RestaurantLegal")
  const router = useRouter()
  const [profile, setProfile] = useState(initial)
  const [mode, setMode] = useState(initial?.mode ?? "inherit")
  const [countryCode, setCountryCode] = useState(
    initial?.effectiveProfile.countryCode ?? ""
  )
  const [name, setName] = useState(initial?.effectiveProfile.name ?? "")
  const [registrationNumber, setRegistrationNumber] = useState(
    initial?.effectiveProfile.registrationNumber ?? ""
  )
  const [taxIdentifier, setTaxIdentifier] = useState(
    initial?.effectiveProfile.taxIdentifier ?? ""
  )
  const [error, setError] = useState<string | null>(
    initial ? null : "unavailable"
  )
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const dirty =
    !profile ||
    mode !== profile.mode ||
    countryCode !== (profile.effectiveProfile.countryCode ?? "") ||
    name !== (profile.effectiveProfile.name ?? "") ||
    registrationNumber !==
      (profile.effectiveProfile.registrationNumber ?? "") ||
    taxIdentifier !== (profile.effectiveProfile.taxIdentifier ?? "")

  useEffect(() => {
    if (!dirty) return

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", warn)

    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function chooseMode(next: "inherit" | "custom") {
    if (next === "custom" && mode === "inherit" && profile) {
      setCountryCode(profile.effectiveProfile.countryCode ?? "")
      setName(profile.effectiveProfile.name ?? "")
      setRegistrationNumber(
        profile.effectiveProfile.countryCode === "FR"
          ? ""
          : (profile.effectiveProfile.registrationNumber ?? "")
      )
      setTaxIdentifier(profile.effectiveProfile.taxIdentifier ?? "")
    }

    setMode(next)
    setError(null)
    setSaved(false)
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || pending) return
    startTransition(async () => {
      const result = await saveTenantLegalProfileAction({
        tenantId,
        version: profile.version,
        mode,
        countryCode,
        name,
        registrationNumber,
        taxIdentifier,
      })

      if (!result.ok || !result.data) {
        setError(result.ok ? "unavailable" : result.error)
        setSaved(false)

        return
      }

      setProfile(result.data)
      setMode(result.data.mode)
      setCountryCode(result.data.effectiveProfile.countryCode ?? "")
      setName(result.data.effectiveProfile.name ?? "")
      setRegistrationNumber(
        result.data.effectiveProfile.registrationNumber ?? ""
      )
      setTaxIdentifier(result.data.effectiveProfile.taxIdentifier ?? "")
      setError(null)
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} className="grid gap-5 border p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">
        {mode === "inherit"
          ? t("inheritedDescription")
          : t("customDescription")}
      </p>

      <fieldset className="grid gap-3 sm:grid-cols-2" disabled={pending}>
        <legend className="mb-2 font-semibold">{t("profileMode")}</legend>

        <RadioGroup
          value={mode}
          disabled={pending}
          onValueChange={(value) => chooseMode(value as "inherit" | "custom")}
          className="grid gap-3 sm:grid-cols-2"
        >
          <Label
            htmlFor="legal-mode-inherit"
            className="flex min-h-11 items-center gap-3 border p-3"
          >
            <RadioGroupItem id="legal-mode-inherit" value="inherit" />

            {t("inherit")}
          </Label>

          <Label
            htmlFor="legal-mode-custom"
            className="flex min-h-11 items-center gap-3 border p-3"
          >
            <RadioGroupItem id="legal-mode-custom" value="custom" />

            {t("custom")}
          </Label>
        </RadioGroup>
      </fieldset>

      {mode === "inherit" ? (
        <dl className="grid gap-3 border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">{t("country")}</dt>

            <dd>
              {profile?.effectiveProfile.countryCode ?? t("notConfigured")}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-muted-foreground">{t("legalName")}</dt>

            <dd>{profile?.effectiveProfile.name ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-muted-foreground">
              {t("registrationNumber")}
            </dt>

            <dd>{profile?.effectiveProfile.registrationNumber ?? "—"}</dd>
          </div>

          <div>
            <dt className="text-sm text-muted-foreground">
              {t("taxIdentifier")}
            </dt>

            <dd>{profile?.effectiveProfile.taxIdentifier ?? "—"}</dd>
          </div>
        </dl>
      ) : (
        <div className="grid gap-4 border p-4 md:grid-cols-2">
          <Label htmlFor="restaurant-legal-country" className="grid gap-2">
            {t("country")}

            <NativeSelect
              id="restaurant-legal-country"
              required
              value={countryCode}
              onChange={(event) => {
                setCountryCode(event.currentTarget.value)
                setRegistrationNumber("")
                setTaxIdentifier("")
              }}
            >
              <NativeSelectOption value="">
                {t("chooseCountry")}
              </NativeSelectOption>

              <NativeSelectOption value="FR">
                {t("countryFrance")}
              </NativeSelectOption>

              <NativeSelectOption value="DE">
                {t("countryGermany")}
              </NativeSelectOption>

              <NativeSelectOption value="GB">
                {t("countryUnitedKingdom")}
              </NativeSelectOption>

              <NativeSelectOption value="US">
                {t("countryUnitedStates")}
              </NativeSelectOption>
            </NativeSelect>
          </Label>

          <Label htmlFor="restaurant-legal-name" className="grid gap-2">
            {t("legalName")}

            <Input
              id="restaurant-legal-name"
              value={name}
              maxLength={200}
              onChange={(event) => setName(event.currentTarget.value)}
            />
          </Label>

          <Label
            htmlFor="restaurant-registration-number"
            className="grid gap-2"
          >
            {t(`registration${countryCode}`)}

            <Input
              id="restaurant-registration-number"
              value={registrationNumber}
              maxLength={32}
              onChange={(event) =>
                setRegistrationNumber(event.currentTarget.value)
              }
            />
          </Label>

          <Label htmlFor="restaurant-tax-identifier" className="grid gap-2">
            {t(`tax${countryCode}`)}

            <Input
              id="restaurant-tax-identifier"
              value={taxIdentifier}
              maxLength={32}
              onChange={(event) => setTaxIdentifier(event.currentTarget.value)}
            />
          </Label>
        </div>
      )}

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {t("errors." + (error === "conflict" ? "conflict" : "unavailable"))}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || !profile || !dirty}>
          {pending ? t("saving") : t("save")}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending || !profile || !dirty}
          onClick={() => {
            setMode(profile!.mode)
            setCountryCode(profile!.effectiveProfile.countryCode ?? "")
            setName(profile!.effectiveProfile.name ?? "")
            setRegistrationNumber(
              profile!.effectiveProfile.registrationNumber ?? ""
            )
            setTaxIdentifier(profile!.effectiveProfile.taxIdentifier ?? "")
            setError(null)
            setSaved(false)
          }}
        >
          {t("cancel")}
        </Button>

        {saved && !dirty && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("saved")}
          </p>
        )}
      </div>
    </form>
  )
}
