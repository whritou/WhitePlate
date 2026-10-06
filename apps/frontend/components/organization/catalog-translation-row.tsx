"use client"

import { saveCatalogTranslationAction } from "@/actions/organization"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useWorkspaceToast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TranslationRow } from "@/types/catalog"
import { useTranslations } from "next-intl"
import { useState } from "react"

export function CatalogTranslationRow({
  tenantId,
  row,
  locale,
  initialName,
  initialDescription,
  label,
}: {
  tenantId: string
  row: TranslationRow
  locale: string
  initialName: string
  initialDescription: string | null
  label: string
}) {
  const t = useTranslations("Auth")
  const toast = useWorkspaceToast()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? "")
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">(
    "idle"
  )

  async function save() {
    setState("pending")

    const result = await saveCatalogTranslationAction({
      tenantId,
      entityType: row.type,
      entityId: row.id,
      locale,
      name,
      description: row.type === "products" ? description : null,
    }).catch(() => ({ ok: false as const }))

    if (result.ok) {
      toast.success(t("translationSaved"))
      setState("idle")
    } else setState("error")
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{label}</Badge>

        <h3 className="font-medium">{row.name}</h3>
      </div>

      <Label className="grid gap-1.5 text-sm font-medium">
        {t("translatedName")}

        <Input
          disabled={state === "pending"}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setState("idle")
          }}
          maxLength={row.type === "products" ? 160 : 120}
          required
          className="h-9 rounded-md border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </Label>

      {row.type === "products" && (
        <Label className="grid gap-1.5 text-sm font-medium">
          {t("translatedDescription")}

          <Textarea
            disabled={state === "pending"}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setState("idle")
            }}
            maxLength={1000}
            rows={2}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </Label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void save()}
          disabled={state === "pending"}
        >
          {state === "pending" ? t("savingTranslation") : t("saveTranslation")}
        </Button>

        {state === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {t("translationError")}
          </p>
        )}
      </div>
    </div>
  )
}
