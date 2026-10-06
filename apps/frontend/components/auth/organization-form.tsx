"use client"

import { createOrganizationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import type { ActionState } from "@/types/organization"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { ResultMessage } from "./result-message"

export function OrganizationForm() {
  const t = useTranslations("Auth")
  const locale = useLocale()
  const router = useRouter()
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState({ status: "pending" })

    const result = await createOrganizationAction(
      new FormData(event.currentTarget)
    ).catch(() => ({ ok: false as const, message: "unavailable" as const }))

    if (result.ok) {
      setState({ status: "success" })
      router.push("/organization")
    } else setState({ status: "error", error: result.message })
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <Label className="grid gap-2 font-medium" htmlFor="organization-name">
        {t("organizationName")}

        <Input
          id="organization-name"
          name="name"
          disabled={state.status === "pending"}
          required
          maxLength={200}
          className="px-3"
        />
      </Label>

      <input type="hidden" name="locale" value={locale} />

      <ResultMessage
        state={state}
        message={
          state.status === "success"
            ? t("organizationCreated")
            : state.error === "unauthorized"
              ? t("sessionRequired")
              : state.error === "invalid"
                ? t("invalidOrganization")
                : t("serviceError")
        }
      />

      <Button type="submit" disabled={state.status === "pending"}>
        {state.status === "pending" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <>
            {t("createOrganizationAction")}

            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  )
}
