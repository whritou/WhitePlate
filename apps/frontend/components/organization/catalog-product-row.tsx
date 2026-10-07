"use client"

import { SlidersHorizontal } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { ManagedCatalog, CatalogProduct } from "@/types/catalog-management"
import { ProductForm } from "./product-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreProductButton } from "./restore-product-button"
import { OptionGroupsEditor } from "./option-groups-editor"

export function CatalogProductRow({
  catalog,
  product,
}: {
  catalog: ManagedCatalog
  product: CatalogProduct
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const locale = useLocale()
  const category = catalog.categories.find(
    (item) => item.id === product.categoryId
  )
  const archived = product.isArchived || !!category?.isArchived

  return (
    <article className="grid gap-4 py-5 xl:grid-cols-[minmax(0,1fr)_auto]">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <p className="mb-1 text-sm break-words text-muted-foreground">
            {category?.name}
          </p>

          <h3 className="text-lg font-semibold break-words">{product.name}</h3>

          {product.description && (
            <p className="mt-1 max-w-xl text-sm break-words text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="mt-3">
            <Badge
              variant={
                archived
                  ? "neutral"
                  : product.isAvailable
                    ? "success"
                    : "warning"
              }
            >
              {t(
                archived
                  ? "archived"
                  : product.isAvailable
                    ? "available"
                    : "unavailable"
              )}
            </Badge>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-lg font-semibold tabular-nums">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: catalog.currency,
            }).format(product.basePrice)}
          </p>

          <p className="text-sm text-muted-foreground">
            {t("taxValue", { value: product.taxRatePercent })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2 xl:pl-4">
        {!archived && (
          <EditorDialog
            title={t("editProduct", { name: product.name })}
            label={u("edit")}
            description={u("productEditorHelp")}
          >
            {(callbacks) => (
              <ProductForm
                tenantId={catalog.tenantId}
                currency={catalog.currency}
                categories={catalog.categories}
                product={product}
                {...callbacks}
              />
            )}
          </EditorDialog>
        )}

        <EditorDialog
          icon={SlidersHorizontal}
          title={u("optionsFor", { name: product.name })}
          label={u("options")}
          description={u("optionsHelp")}
        >
          {() => (
            <OptionGroupsEditor
              tenantId={catalog.tenantId}
              currency={catalog.currency}
              productId={product.id}
              productName={product.name}
              optionGroups={catalog.optionGroups}
              options={catalog.options}
              parentArchived={archived}
            />
          )}
        </EditorDialog>

        {!archived && (
          <ArchiveCatalogButton
            tenantId={catalog.tenantId}
            id={product.id}
            entityType="products"
            name={product.name}
          />
        )}

        {product.isArchived && !category?.isArchived && (
          <RestoreProductButton tenantId={catalog.tenantId} id={product.id} />
        )}
      </div>
    </article>
  )
}
