"use client"

import { useRef, useState } from "react"
import { X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { saveProductAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CatalogProduct, ManagedCatalog } from "@/types/catalog-management"
import type { ProductPhotosEditorHandle } from "@/types/product-photos"
import { EditorFormActions } from "@/components/ui/editor-dialog"
import { ProductForm } from "./product-form"
import { ProductExtrasTable } from "./product-extras-table"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreProductButton } from "./restore-product-button"
import { ProductPhotosEditor } from "./product-photos-editor"

export function MenuBuilderProduct({
  userId,
  catalog,
  product,
  open,
  onOpenChange,
  onProductRestored,
  pending,
  onPendingChange,
}: {
  userId?: string
  catalog: ManagedCatalog
  product: CatalogProduct
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductRestored: () => void
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const e = useTranslations("Editor")
  const locale = useLocale()
  const category = catalog.categories.find(
    (item) => item.id === product.categoryId
  )
  const archived = product.isArchived || !!category?.isArchived
  const [dirty, setDirty] = useState(false)
  const [photosDirty, setPhotosDirty] = useState(false)
  const [revision, setRevision] = useState(0)
  const editor = useRef<HTMLDivElement>(null)
  const photosEditor = useRef<ProductPhotosEditorHandle>(null)
  const formId = `${product.id}-form`
  const hasChanges = dirty || photosDirty
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: catalog.currency,
  })

  function discard() {
    photosEditor.current?.discard()
    setPhotosDirty(false)
    setRevision((value) => value + 1)
    setDirty(false)
    requestAnimationFrame(() =>
      editor.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus()
    )
  }

  async function saveProductChanges(input: FormData) {
    if (photosDirty) {
      const saved = await photosEditor.current?.save()

      if (!saved) return { ok: false as const, error: "unavailable" as const }

      setPhotosDirty(false)
    }

    return dirty ? saveProductAction(input) : { ok: true as const }
  }

  return (
    <section
      className="live-product-panel min-w-0 border-l bg-background p-5"
      hidden={!open}
      aria-label={product.name}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !pending) {
          event.stopPropagation()
          onOpenChange(false)
        }
      }}
    >
      <div
        className="live-product-form-shell"
        role={archived ? undefined : "form"}
        aria-label={
          archived ? undefined : c("editProduct", { name: product.name })
        }
      >
        <header className="relative border-b border-border pr-14 pb-5">
          <h2 className="font-heading text-2xl font-bold break-words">
            {product.name}
          </h2>

          <p className="text-sm text-muted-foreground">{category?.name}</p>

          <Button
            disabled={pending}
            aria-label={e("close")}
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            onClick={() => onOpenChange(false)}
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <fieldset
          disabled={pending}
          aria-busy={pending}
          className="live-product-panel-body grid min-w-0 flex-1 content-start gap-6 border-0 p-0"
        >
          <div className="grid min-w-0 content-start gap-6">
            {userId && (
              <ProductPhotosEditor
                ref={photosEditor}
                key={`${userId}:${catalog.tenantId}:${product.id}`}
                userId={userId}
                tenantId={catalog.tenantId}
                productId={product.id}
                archived={archived}
                onPendingChange={onPendingChange}
                onDraftChange={setPhotosDirty}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge
                variant={
                  archived
                    ? "neutral"
                    : product.isAvailable
                      ? "success"
                      : "warning"
                }
              >
                {c(
                  archived
                    ? "archived"
                    : product.isAvailable
                      ? "available"
                      : "unavailable"
                )}
              </Badge>
            </div>

            <section aria-label={t("productDetails")} className="grid gap-4">
              <h2 className="font-semibold">{t("productDetails")}</h2>

              <p className="text-sm break-words whitespace-pre-wrap">
                {product.description || t("noDescription")}
              </p>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">
                    {c("price", { currency: catalog.currency })}
                  </dt>

                  <dd className="mt-1 font-semibold tabular-nums">
                    {money.format(product.basePrice)}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground">{c("tax")}</dt>

                  <dd className="mt-1 tabular-nums">
                    {new Intl.NumberFormat(locale, {
                      style: "percent",
                      maximumFractionDigits: 2,
                    }).format(product.taxRatePercent / 100)}
                  </dd>
                </div>
              </dl>

              {!category?.isVisible && !category?.isArchived && (
                <p className="text-sm text-warning">
                  {t("categoryHiddenHelp")}
                </p>
              )}
            </section>

            {!archived && (
              <section className="grid gap-4 border-t border-border pt-5">
                <h2 className="font-semibold">{t("productEditor")}</h2>

                <p role="status" className="text-xs text-muted-foreground">
                  {t(hasChanges ? "unsaved" : "savedFields")}
                </p>

                <div ref={editor}>
                  <ProductForm
                    key={revision}
                    tenantId={catalog.tenantId}
                    currency={catalog.currency}
                    categories={catalog.categories}
                    product={product}
                    action={saveProductChanges}
                    formId={formId}
                    showActions={false}
                    semanticForm={false}
                    onPendingChange={onPendingChange}
                    onSuccess={() => {
                      setDirty(false)
                      setPhotosDirty(false)
                    }}
                    onDirtyChange={() => setDirty(true)}
                    onCancel={discard}
                  />
                </div>
              </section>
            )}

            {archived && (
              <section className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  {t("archivedHelp")}
                </p>

                {product.isArchived && !category?.isArchived && (
                  <RestoreProductButton
                    tenantId={catalog.tenantId}
                    id={product.id}
                    onPendingChange={onPendingChange}
                    onRestored={onProductRestored}
                  />
                )}
              </section>
            )}

            <ProductExtrasTable
              catalog={catalog}
              product={product}
              archived={archived}
              pending={pending}
              onPendingChange={onPendingChange}
            />
          </div>
        </fieldset>

        {!archived && (
          <footer className="live-product-actions">
            <ArchiveCatalogButton
              tenantId={catalog.tenantId}
              id={product.id}
              entityType="products"
              name={product.name}
              disabled={pending}
              onPendingChange={onPendingChange}
            />

            <EditorFormActions
              form={formId}
              className="live-product-save-actions border-0 p-0 pt-0"
              pending={pending}
              onCancel={discard}
              cancelDisabled={!hasChanges}
              disabled={!hasChanges}
              label={pending ? t("saving") : c("save")}
            />
          </footer>
        )}
      </div>
    </section>
  )
}
