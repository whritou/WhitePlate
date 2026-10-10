"use client"

import { renameOrganizationAction } from "@/actions/organization"
import { OrganizationArchiveAction } from "@/components/organization/organization-archive-action"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "@/i18n/navigation"
import { useWorkspaceToast } from "@/components/ui/toast"
import type { ActionState } from "@/types/organization"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition, type FormEvent } from "react"

export function OrganizationSettingsForm({
  organizationId,
  organizationName,
  organizationActive,
  showLifecycle = true,
}: {
  organizationId: string
  organizationName: string
  organizationActive: boolean
  showLifecycle?: boolean
}) {
  const t = useTranslations("OrganizationSettings")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const submitting = useRef(false)
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(organizationName)
  const [state, setState] = useState<ActionState>({ status: "idle" })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting.current) return

    const form = new FormData(event.currentTarget)

    submitting.current = true
    setState({ status: "pending" })
    startTransition(async () => {
      try {
        const result = await renameOrganizationAction(form)

        if (!result.ok) {
          setState({ status: "error", error: result.message })

          return
        }

        setName(String(form.get("name") ?? "").trim())
        toast.success(t("updated"))
        setState({ status: "success" })
        router.refresh()
      } catch {
        setState({ status: "error", error: "unavailable" })
      } finally {
        submitting.current = false
      }
    })
  }

  const message =
    state.status === "success"
      ? t("updated")
      : t(`errors.${state.error ?? "unavailable"}`)

  return (
    <form onSubmit={submit} aria-busy={pending} className="grid gap-5">
      <input type="hidden" name="organizationId" value={organizationId} />

      <fieldset
        disabled={pending}
        className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <Label htmlFor="organization-name" className="grid gap-2">
          {t("name")}

          <Input
            id="organization-name"
            name="name"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            required
            maxLength={200}
          />
        </Label>

        <Button type="submit">{pending ? t("saving") : t("save")}</Button>
      </fieldset>

      <ResultMessage state={state} message={message} hideSuccess />

      {showLifecycle && (
        <OrganizationArchiveAction
          organizationId={organizationId}
          active={organizationActive}
        />
      )}
    </form>
  )
}
