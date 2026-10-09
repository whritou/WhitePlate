"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { CatalogCategory } from "@/types/catalog-management"
import { CategoryForm } from "./category-form"

export function ProductCategoryField({
  tenantId,
  categories,
  initialId,
  prefix,
  onPendingChange,
  onCreated,
}: {
  tenantId: string
  categories: CatalogCategory[]
  initialId?: string
  prefix: string
  onPendingChange: (pending: boolean) => void
  onCreated?: () => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("MenuBuilder")
  const [created, setCreated] = useState<CatalogCategory[]>([])
  const [selectedId, setSelectedId] = useState(
    initialId ?? categories.find((item) => !item.isArchived)?.id ?? ""
  )
  const available = [
    ...categories,
    ...created.filter(
      (item) => !categories.some((category) => category.id === item.id)
    ),
  ]
    .filter((item) => !item.isArchived)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))

  return (
    <div className="grid gap-2 sm:col-span-2">
      <Label htmlFor={`${prefix}-category`}>{t("category")}</Label>

      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect
          id={`${prefix}-category`}
          name="categoryId"
          value={selectedId}
          required
          onChange={(event) => setSelectedId(event.target.value)}
          className="min-w-0 flex-1"
          selectClassName="w-full"
        >
          <NativeSelectOption value="" disabled>
            {u("chooseCategory")}
          </NativeSelectOption>

          {available.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <EditorDialog
          icon={Plus}
          title={t("createCategory")}
          label={t("createCategory")}
          description={u("categoryHelp")}
        >
          {(callbacks) => (
            <CategoryForm
              tenantId={tenantId}
              {...callbacks}
              onCreated={(category) => {
                setCreated((current) => [...current, category])
                setSelectedId(category.id)
                onCreated?.()
              }}
              onPendingChange={(value) => {
                callbacks.onPendingChange?.(value)
                onPendingChange(value)
              }}
            />
          )}
        </EditorDialog>
      </div>

      {available.length === 0 && (
        <p className="text-sm text-muted-foreground">{u("startCategory")}</p>
      )}
    </div>
  )
}
