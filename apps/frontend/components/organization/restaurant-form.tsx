"use client"

import { createRestaurantAction } from "@/actions/restaurant"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useRouter } from "@/i18n/navigation"
import type { ActionState } from "@/types/organization"
import type { RestaurantFormProps } from "@/types/restaurant"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition, type FormEvent } from "react"

export function RestaurantForm({ organizationId }: RestaurantFormProps) {
  const t = useTranslations("Restaurants")
  const router = useRouter()
  const submitting = useRef(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState>({ status: "idle" })

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
    <form onSubmit={submit} className="grid gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <fieldset disabled={pending} className="grid gap-5">
        <Label htmlFor="restaurant-name" className="grid gap-2">
          {t("name")}

          <Input id="restaurant-name" name="name" required maxLength={200} />
        </Label>

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
        message={
          state.status === "success"
            ? t("created")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
