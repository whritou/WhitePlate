"use client"

import { createRestaurantAction } from "@/actions/restaurant"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { ActionState } from "@/types/organization"
import type { RestaurantFormProps } from "@/types/restaurant"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition, type FormEvent } from "react"

export function RestaurantForm({
  organizationId,
  organizationProfile,
}: RestaurantFormProps) {
  const t = useTranslations("Restaurants")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const submitting = useRef(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState>({ status: "idle" })
  const [customLegalProfile, setCustomLegalProfile] = useState(false)
  const [legalCountry, setLegalCountry] = useState(
    organizationProfile.legalCountryCode ?? "FR"
  )
  const [registrationNumber, setRegistrationNumber] = useState(
    organizationProfile.legalCountryCode === "FR"
      ? ""
      : (organizationProfile.legalRegistrationNumber ?? "")
  )
  const [taxIdentifier, setTaxIdentifier] = useState(
    organizationProfile.taxIdentifier ?? ""
  )

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting.current) return

    const form = new FormData(event.currentTarget)

    submitting.current = true
    setState({ status: "pending" })
    startTransition(async () => {
      try {
        const result = await createRestaurantAction(form)

        if (!result.ok) {
          setState({ status: "error", error: result.message })

          return
        }

        toast.success(t("created"))
        setState({ status: "success" })
        router.push(`/organization/team?organizationId=${organizationId}`)
        router.refresh()
      } catch {
        setState({ status: "error", error: "unavailable" })
      } finally {
        submitting.current = false
      }
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-5 border p-6">
      <input type="hidden" name="organizationId" value={organizationId} />

      <fieldset disabled={pending} className="grid gap-5">
        <Label htmlFor="restaurant-name" className="grid gap-2">
          {t("name")}

          <Input id="restaurant-name" name="name" required maxLength={200} />
        </Label>

        <input
          type="hidden"
          name="legalProfileMode"
          value={customLegalProfile ? "custom" : "inherit"}
        />

        <Label
          htmlFor="custom-legal-profile"
          className="flex min-h-11 items-center gap-3 text-sm font-medium"
        >
          <Checkbox
            id="custom-legal-profile"
            checked={customLegalProfile}
            onCheckedChange={(checked) =>
              setCustomLegalProfile(checked === true)
            }
          />

          {t("customLegalProfile")}
        </Label>

        {!customLegalProfile && (
          <p className="text-sm text-muted-foreground">
            {t("inheritsLegalProfile", {
              profile:
                organizationProfile.legalName ??
                organizationProfile.legalCountryCode ??
                t("legalProfileIncomplete"),
            })}
          </p>
        )}

        {customLegalProfile && (
          <div className="grid gap-4 border p-4 md:grid-cols-2">
            <Label htmlFor="restaurant-legal-country" className="grid gap-2">
              {t("legalCountry")}

              <NativeSelect
                id="restaurant-legal-country"
                name="legalCountryCode"
                value={legalCountry}
                onChange={(event) => {
                  const country = event.currentTarget.value

                  setLegalCountry(country)
                  setRegistrationNumber(
                    country === organizationProfile.legalCountryCode &&
                      country !== "FR"
                      ? (organizationProfile.legalRegistrationNumber ?? "")
                      : ""
                  )
                  setTaxIdentifier("")
                }}
                required
              >
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
                name="legalName"
                maxLength={200}
                defaultValue={organizationProfile.legalName ?? ""}
              />
            </Label>

            <Label htmlFor="restaurant-registration" className="grid gap-2">
              {t(`legalRegistration${legalCountry}`)}

              <Input
                id="restaurant-registration"
                name="legalRegistrationNumber"
                maxLength={32}
                value={registrationNumber}
                onChange={(event) =>
                  setRegistrationNumber(event.currentTarget.value)
                }
              />
            </Label>

            <Label htmlFor="restaurant-tax-id" className="grid gap-2">
              {t(`legalTax${legalCountry}`)}

              <Input
                id="restaurant-tax-id"
                name="taxIdentifier"
                maxLength={32}
                value={taxIdentifier}
                onChange={(event) =>
                  setTaxIdentifier(event.currentTarget.value)
                }
              />
            </Label>
          </div>
        )}

        <Label htmlFor="restaurant-subdomain" className="grid gap-2">
          {t("subdomain")}

          <Input
            id="restaurant-subdomain"
            name="subdomain"
            required
            maxLength={63}
            pattern="[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby="subdomain-hint"
          />
        </Label>

        <p id="subdomain-hint" className="text-sm text-muted-foreground">
          {t("subdomainHint")}
        </p>

        <Label htmlFor="restaurant-currency" className="grid gap-2">
          {t("currency")}

          <NativeSelect
            id="restaurant-currency"
            name="currency"
            defaultValue="EUR"
            aria-label={t("currency")}
          >
            <NativeSelectOption value="EUR">EUR</NativeSelectOption>

            <NativeSelectOption value="USD">USD</NativeSelectOption>

            <NativeSelectOption value="GBP">GBP</NativeSelectOption>
          </NativeSelect>
        </Label>

        <Button type="submit">{pending ? t("saving") : t("create")}</Button>
      </fieldset>

      <ResultMessage
        state={state}
        hideSuccess
        message={
          state.status === "success"
            ? t("created")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
