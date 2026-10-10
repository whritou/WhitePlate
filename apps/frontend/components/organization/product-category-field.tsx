"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
  formId,
  disabled,
  onAddingChange,
}: {
  tenantId: string
  categories: CatalogCategory[]
  initialId?: string
  prefix: string
  onPendingChange: (pending: boolean) => void
  onCreated?: () => void
  formId: string
  disabled: boolean
  onAddingChange: (adding: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("MenuBuilder")
  const [created, setCreated] = useState<CatalogCategory[]>([])
  const [adding, setAdding] = useState(false)
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
          form={formId}
          value={selectedId}
          required
          disabled={disabled}
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

        <Button
          type="button"
          variant="outline"
          aria-expanded={adding}
          disabled={disabled}
          onClick={() => {
            setAdding(!adding)
            onAddingChange(!adding)
          }}
        >
          <Plus aria-hidden="true" />

          {t("createCategory")}
        </Button>
      </div>

      {adding && (
        <section className="grid gap-3 border border-border bg-secondary p-4">
          <h3 className="font-semibold">{t("createCategory")}</h3>

          <p className="text-sm text-muted-foreground">{u("categoryHelp")}</p>

          <CategoryForm
            tenantId={tenantId}
            onCancel={() => {
              setAdding(false)
              onAddingChange(false)
            }}
            onSuccess={() => {
              setAdding(false)
              onAddingChange(false)
            }}
            onCreated={(category) => {
              setCreated((current) => [...current, category])
              setSelectedId(category.id)
              onCreated?.()
            }}
            onPendingChange={(value) => {
              onPendingChange(value)
            }}
          />
        </section>
      )}

      {available.length === 0 && (
        <p className="text-sm text-muted-foreground">{u("startCategory")}</p>
      )}
    </div>
  )
}
