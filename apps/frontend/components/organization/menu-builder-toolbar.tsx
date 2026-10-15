"use client"

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ProductForm } from "./product-form"
import type { MenuBuilderToolbarProps } from "@/types/menu-builder"

export function MenuBuilderToolbar({
  catalog,
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
      <h2 className="min-w-0 flex-1 basis-48 font-display text-2xl font-bold">
        {title}
      </h2>

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
