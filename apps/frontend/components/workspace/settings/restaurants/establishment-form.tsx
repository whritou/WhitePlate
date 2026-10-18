"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  establishmentDraft,
  establishmentDraftErrors,
  establishmentInput,
} from "@/lib/establishment-draft"
import type { ApiError } from "@/types/api"
import type {
  EstablishmentDraft,
  EstablishmentFormProps,
  EstablishmentSettings,
} from "@/types/establishment-settings"
import { CollectionInformation } from "@/components/storefront/collection-information"
import { EstablishmentFields } from "./establishment-fields"
import { OpeningHoursEditor } from "./opening-hours-editor"

export function EstablishmentForm({
  tenantId,
  section = "establishment",
  value,
  save,
  reload,
  onSaved,
  onAccessLost,
}: EstablishmentFormProps) {
  const t = useTranslations("EstablishmentSettings")
  const [editing, setEditing] = useState<{
    draft: EstablishmentDraft
    saved: EstablishmentSettings
  } | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [confirmReload, setConfirmReload] = useState(false)
  const [openingHoursReloadKey, setOpeningHoursReloadKey] = useState(0)
  const pendingRef = useRef(false)
  const saved = editing?.saved ?? value.settings
  const draft = editing?.draft ?? establishmentDraft(saved)
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(establishmentDraft(saved))

  useEffect(() => {
    if (!dirty) return

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", warn)

    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function change(next: EstablishmentDraft) {
    setEditing(
      JSON.stringify(next) === JSON.stringify(establishmentDraft(saved))
        ? null
        : { draft: next, saved }
    )
    setSavedNotice(false)
    setErrors({})
  }

  function submit() {
    if (pendingRef.current || !dirty) return

    const invalid = establishmentDraftErrors(draft, value.options)

    setErrors(invalid)
    if (Object.keys(invalid).length) {
      setError("invalid")

      const field = Object.keys(invalid)[0]

      document
        .getElementById(field.startsWith("pickup-") ? field : `est-${field}`)
        ?.focus()

      return
    }

    pendingRef.current = true
    setPending(true)
    setError(null)
    startTransition(async () => {
      try {
        const result = await save(establishmentInput(tenantId, saved, draft))

        if (result.ok && result.data) {
          await onSaved(result.data)
          setEditing(null)
          setSavedNotice(true)
          setConfirmReload(false)
        } else if (!result.ok) {
          setError(result.error)

          const fields = (result.validationFields ?? []).map(
            (field) => field.charAt(0).toLowerCase() + field.slice(1)
          )
          const invalidFields = fields
            .filter((field) => field in draft && field !== "pickupInstructions")
            .map((field) => [field, true] as const)

          setErrors(
            Object.fromEntries([
              ...invalidFields,
              ...(fields.includes("pickupInstructions")
                ? saved.locales.map(
                    (language) => [`pickup-${language}`, true] as const
                  )
                : []),
            ])
          )
          if (["unauthorized", "forbidden", "not_found"].includes(result.error))
            onAccessLost()
        } else setError("unavailable")
      } catch {
        setError("unavailable")
      } finally {
        pendingRef.current = false
        setPending(false)
      }
    })
  }

  async function discardAndReload() {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    try {
      const fresh = await reload()

      if (fresh) {
        setEditing(null)
        setOpeningHoursReloadKey((current) => current + 1)
        setError(null)
        setErrors({})
        setConfirmReload(false)
      } else setError("unavailable")
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:[&_[data-slot=input]]:min-h-12 md:[&_[data-slot=native-select]]:min-h-12 md:[&_button]:min-h-12">
      <Card>
        <CardContent className="p-4 sm:p-6">
          {section === "establishment" && (
            <form
              aria-busy={pending}
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
              className="grid gap-6"
            >
              <fieldset disabled={pending} className="min-w-0">
                <EstablishmentFields
                  draft={draft}
                  options={value.options}
                  locales={saved.locales}
                  defaultLocale={saved.defaultLocale}
                  errors={errors}
                  change={change}
                />
              </fieldset>

              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
                </Alert>
              )}

              {error === "conflict" && (
                <div className="grid gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() => setConfirmReload(true)}
                  >
                    {t("reload")}
                  </Button>

                  {confirmReload && (
                    <div className="grid gap-3">
                      <p>{t("discardWarning")}</p>

                      <Button
                        type="button"
                        disabled={pending}
                        onClick={() => void discardAndReload()}
                      >
                        {t("confirmReload")}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t pt-5">
                <Button type="submit" disabled={pending || !dirty}>
                  {t(pending ? "saving" : "save")}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={pending || !dirty}
                  onClick={() => {
                    setEditing(null)
                    setErrors({})
                    setError(null)
                    setConfirmReload(false)
                  }}
                >
                  {t("cancel")}
                </Button>

                <p
                  role="status"
                  className="self-center text-sm text-muted-foreground"
                >
                  {pending
                    ? t("saving")
                    : savedNotice
                      ? t("saved")
                      : dirty
                        ? t("unsaved")
                        : t("upToDate")}
                </p>
              </div>
            </form>
          )}

          {section === "hours" && (
            <OpeningHoursEditor
              key={openingHoursReloadKey}
              tenantId={tenantId}
              settings={saved}
              onSaved={async (settings) => {
                setEditing((current) =>
                  current ? { ...current, saved: settings } : null
                )
                await onSaved(settings)
              }}
            />
          )}
        </CardContent>
      </Card>

      {section === "establishment" && (
        <aside className="grid h-fit gap-3 border p-4 sm:p-6">
          <h2 className="font-display text-xl font-bold">{t("preview")}</h2>

          <p className="text-sm text-muted-foreground">{t("previewHelp")}</p>

          <CollectionInformation
            establishment={{
              ...value.settings,
              pickupInstruction:
                value.settings.pickupInstructions[
                  value.settings.defaultLocale
                ] ?? null,
              pickupLocale: value.settings.defaultLocale,
            }}
          />
        </aside>
      )}
    </div>
  )
}
