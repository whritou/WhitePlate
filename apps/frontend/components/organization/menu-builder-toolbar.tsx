"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { saveCategoryAction } from "@/actions/catalog"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { CatalogCategory } from "@/types/catalog-management"
import { ProductForm } from "./product-form"
import { useCatalogForm } from "./use-catalog-form"
import type { MenuBuilderToolbarProps } from "@/types/menu-builder"

export function MenuBuilderToolbar({
  catalog,
  category,
  title,
  search,
  onSearch,
  visibility,
  onVisibility,
  pending,
  onPendingChange,
}: MenuBuilderToolbarProps) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")

  return (
    <div className="live-menu-toolbar flex min-w-0 flex-wrap items-center gap-3 border-b px-6 py-4">
      {category && !category.isArchived ? (
        <CategoryNameField
          key={`${category.id}:${category.name}`}
          tenantId={catalog.tenantId}
          category={category}
          disabled={pending}
          onPendingChange={onPendingChange}
        />
      ) : (
        <h2 className="min-w-0 flex-1 basis-48 font-display text-2xl font-bold">
          {title}
        </h2>
      )}

      <div className="w-44 max-w-full">
        <Label className="sr-only" htmlFor="builder-product-search">
          {u("search")}
        </Label>

        <Input
          id="builder-product-search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={u("searchPlaceholder")}
        />
      </div>

      <div className="w-44 max-w-full">
        <Label className="sr-only" htmlFor="builder-product-visibility">
          {u("show")}
        </Label>

        <NativeSelect
          id="builder-product-visibility"
          value={visibility}
          onChange={(event) => onVisibility(event.target.value)}
          selectClassName="w-full"
        >
          <NativeSelectOption value="active">
            {u("activeProducts")}
          </NativeSelectOption>

          <NativeSelectOption value="archived">
            {t("archived")}
          </NativeSelectOption>

          <NativeSelectOption value="all">
            {u("allProducts")}
          </NativeSelectOption>
        </NativeSelect>
      </div>

      <EditorDialog
        sourcePrimary
        icon={Plus}
        title={t("newProduct")}
        label={t("newProduct")}
        description={u("productEditorHelp")}
        disabled={pending}
      >
        {(callbacks) => (
          <ProductForm
            tenantId={catalog.tenantId}
            currency={catalog.currency}
            categories={catalog.categories}
            {...callbacks}
            onPendingChange={(value) => {
              callbacks.onPendingChange?.(value)
              onPendingChange(value)
            }}
          />
        )}
      </EditorDialog>
    </div>
  )
}

function CategoryNameField({
  tenantId,
  category,
  disabled,
  onPendingChange,
}: {
  tenantId: string
  category: CatalogCategory
  disabled: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const [name, setName] = useState(category.name)
  const { pending, state, submit } = useCatalogForm(
    saveCategoryAction,
    false,
    undefined,
    undefined,
    onPendingChange
  )

  return (
    <form
      onSubmit={submit}
      className="min-w-0 flex-1 basis-48"
      aria-label={t("editCategory", { name: category.name })}
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={category.id} />

      <input type="hidden" name="sortOrder" value={category.sortOrder} />

      <Label className="sr-only" htmlFor={`category-name-${category.id}`}>
        {t("name")}
      </Label>

      <Input
        id={`category-name-${category.id}`}
        name="name"
        value={name}
        maxLength={120}
        required
        disabled={disabled || pending}
        aria-label={t("name")}
        onChange={(event) => setName(event.target.value)}
        onBlur={(event) => {
          if (event.currentTarget.value.trim() !== category.name)
            event.currentTarget.form?.requestSubmit()
        }}
        className="h-auto border-0 bg-transparent p-0 font-display text-2xl font-bold shadow-none focus-visible:border-0 focus-visible:ring-2"
      />

      {state.status === "error" && (
        <span role="alert" className="text-xs text-destructive">
          {t(`errors.${state.error ?? "unavailable"}`)}
        </span>
      )}
    </form>
  )
}
