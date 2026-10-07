"use client"

import { useRef, useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { saveCatalogTranslationAction } from "@/actions/organization"
import { EditorFormActions } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { TranslationRow, FormState } from "@/types/catalog"
import type { EditorCallbacks } from "@/types/editor"

export function CatalogTranslationForm({
  tenantId,
  row,
  locale,
  initialName,
  initialDescription,
  onCancel,
  onSuccess,
  onPendingChange,
}: EditorCallbacks & {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
}) {
  const t = useTranslations("Auth")
  const u = useTranslations("MenuTranslations")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const locked = useRef(false)
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [state, setState] = useState<FormState>("idle")

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked.current) return
    locked.current = true
    setState("pending")
    onPendingChange?.(true)
    try {
      const result = await saveCatalogTranslationAction({
        tenantId,
        entityType: row.type,
        entityId: row.id,
        locale,
        name,
        description: row.type === "products" ? description : null,
      })

      if (result.ok) {
        toast.success(t("translationSaved"))
        onSuccess?.()
        router.refresh()
      } else setState("error")
    } catch {
      setState("error")
    } finally {
      locked.current = false
      onPendingChange?.(false)
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="grid gap-5">
      <div className="rounded-md bg-muted p-4">
        <p className="text-sm text-muted-foreground">{u("original")}</p>

        <p className="mt-1 font-medium break-words">{row.name}</p>

        {row.description && (
          <p className="mt-1 text-sm break-words">{row.description}</p>
        )}
      </div>

      <fieldset disabled={state === "pending"} className="grid gap-5">
        <Label className="grid gap-2">
          {t("translatedName")}

          <Input
            lang={locale}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={row.type === "products" ? 160 : 120}
            required
          />
        </Label>

        {row.type === "products" && (
          <Label className="grid gap-2">
            {t("translatedDescription")}

            <Textarea
              lang={locale}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={3}
            />
          </Label>
        )}
      </fieldset>

      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {t("translationError")}
        </p>
      )}

      <EditorFormActions
        pending={state === "pending"}
        onCancel={onCancel}
        label={
          state === "pending" ? t("savingTranslation") : t("saveTranslation")
        }
      />
    </form>
  )
}
