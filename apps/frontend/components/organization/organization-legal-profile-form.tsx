"use client"

import { saveOrganizationLegalProfileAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { Organization } from "@/types/organization"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState, useTransition, type FormEvent } from "react"

export function OrganizationLegalProfileForm({
  organization,
}: {
  organization: Organization
}) {
  const t = useTranslations("Auth")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [legalCountry, setLegalCountry] = useState(
    organization.legalCountryCode ?? ""
  )
  const [legalName, setLegalName] = useState(organization.legalName ?? "")
  const [registrationNumber, setRegistrationNumber] = useState(
    organization.legalRegistrationNumber ?? ""
  )
  const [taxIdentifier, setTaxIdentifier] = useState(
    organization.taxIdentifier ?? ""
  )
  const dirty =
    legalCountry !== (organization.legalCountryCode ?? "") ||
    legalName !== (organization.legalName ?? "") ||
    registrationNumber !== (organization.legalRegistrationNumber ?? "") ||
    taxIdentifier !== (organization.taxIdentifier ?? "")

  useEffect(() => {
    if (!dirty) return

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", warn)

    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await saveOrganizationLegalProfileAction({
        organizationId: organization.id,
        version: organization.legalProfileVersion ?? 1,
        legalCountryCode: form.get("legalCountryCode"),
        legalName: legalName || null,
        legalRegistrationNumber: registrationNumber || null,
        taxIdentifier: taxIdentifier || null,
      })

      setError(!result.ok)
      setSaved(result.ok)
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <Label className="grid gap-2" htmlFor="organization-legal-country">
        {t("legalCountry")}

        <NativeSelect
          id="organization-legal-country"
          name="legalCountryCode"
          required
          value={legalCountry}
          onChange={(event) => {
            setLegalCountry(event.currentTarget.value)
            setRegistrationNumber("")
            setTaxIdentifier("")
          }}
        >
          <NativeSelectOption value="">
            {t("chooseLegalCountry")}
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

      <Label className="grid gap-2" htmlFor="organization-legal-name">
        {t("legalName")}

        <Input
          id="organization-legal-name"
          name="legalName"
          maxLength={200}
          value={legalName}
          onChange={(event) => setLegalName(event.currentTarget.value)}
        />
      </Label>

      <Label className="grid gap-2" htmlFor="organization-registration">
        {t(`legalRegistration${legalCountry}`)}

        <Input
          id="organization-registration"
          name="legalRegistrationNumber"
          maxLength={32}
          value={registrationNumber}
          onChange={(event) => setRegistrationNumber(event.currentTarget.value)}
        />
      </Label>

      <Label className="grid gap-2" htmlFor="organization-tax-id">
        {t(`legalTax${legalCountry}`)}

        <Input
          id="organization-tax-id"
          name="taxIdentifier"
          maxLength={32}
          value={taxIdentifier}
          onChange={(event) => setTaxIdentifier(event.currentTarget.value)}
        />
      </Label>

      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? t("savingLegalProfile") : t("saveLegalProfile")}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={pending || !dirty}
          onClick={() => {
            setLegalCountry(organization.legalCountryCode ?? "")
            setLegalName(organization.legalName ?? "")
            setRegistrationNumber(organization.legalRegistrationNumber ?? "")
            setTaxIdentifier(organization.taxIdentifier ?? "")
            setError(false)
            setSaved(false)
          }}
        >
          {t("cancelLegalProfile")}
        </Button>

        <p
          role={error ? "alert" : "status"}
          className="text-sm text-muted-foreground"
        >
          {error
            ? t("legalProfileSaveError")
            : saved
              ? t("legalProfileSaved")
              : ""}
        </p>
      </div>
    </form>
  )
}
