"use client"

import { useRef, useState } from "react"
import { Pencil, RotateCcw, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { CatalogProduct, ManagedCatalog } from "@/types/catalog-management"
import type { MenuLanguageSettings } from "@/types/catalog"
import { ProductForm } from "./product-form"
import { ProductExtrasTable } from "./product-extras-table"
import { CatalogTranslationsEditor } from "./catalog-translations-editor"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreProductButton } from "./restore-product-button"
import { ProductPhotosEditor } from "./product-photos-editor"

export function MenuBuilderProduct({
  userId,
  catalog,
  settings,
  product,
  open,
  onOpenChange,
  pending,
  onPendingChange,
}: {
  userId?: string
  catalog: ManagedCatalog
  settings?: MenuLanguageSettings
  product: CatalogProduct
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const [editing, setEditing] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [revision, setRevision] = useState(0)
  const editor = useRef<HTMLDivElement>(null)
  const groups = catalog.optionGroups.filter(
    (group) => group.productId === product.id
  )
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: catalog.currency,
  })

  function discard() {
    setRevision((value) => value + 1)
    setDirty(false)
    requestAnimationFrame(() =>
      editor.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus()
    )
  }

  return (
    <Sheet
      open={open}
      disablePointerDismissal
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value)
      }}
    >
      <SheetContent
        side="right"
        keepMounted
        aria-busy={pending}
        className="w-full overflow-x-hidden [overflow-wrap:anywhere] sm:w-[min(64rem,calc(100vw-2rem))]"
      >
        <SheetHeader className="relative border-b border-border pr-14 pb-5">
          <SheetTitle className="font-heading text-2xl font-bold break-words">
            {product.name}
          </SheetTitle>

          <SheetDescription className="text-sm text-muted-foreground">
            {category?.name}
          </SheetDescription>

          <SheetClose
            disabled={pending}
            aria-label={e("close")}
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0"
              />
            }
          >
            <X aria-hidden="true" />
          </SheetClose>
        </SheetHeader>

        <fieldset
          disabled={pending}
          aria-busy={pending}
          className="grid min-w-0 gap-6"
        >
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

            {!archived && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(true)}
                >
                  <Pencil aria-hidden="true" className="size-4" />

                  {t("editProduct")}
                </Button>

                <ArchiveCatalogButton
                  tenantId={catalog.tenantId}
                  id={product.id}
                  entityType="products"
                  name={product.name}
                  onPendingChange={onPendingChange}
                />
              </div>
            )}
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
              <p className="text-sm text-warning">{t("categoryHiddenHelp")}</p>
            )}
          </section>

          {editing && !archived && (
            <section className="grid gap-4 border-t border-border pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-semibold">{t("productEditor")}</h2>

                <Button
                  variant="ghost"
                  disabled={!dirty || pending}
                  onClick={discard}
                  aria-label={t("discardProduct")}
                >
                  <RotateCcw aria-hidden="true" className="size-4" />

                  {t("discardProduct")}
                </Button>
              </div>

              <p role="status" className="text-xs text-muted-foreground">
                {t(dirty ? "unsaved" : "savedFields")}
              </p>

              <div ref={editor}>
                <ProductForm
                  key={revision}
                  tenantId={catalog.tenantId}
                  currency={catalog.currency}
                  categories={catalog.categories}
                  product={product}
                  onPendingChange={onPendingChange}
                  onSuccess={() => setDirty(false)}
                  onDirtyChange={() => setDirty(true)}
                  onCancel={() => {
                    setEditing(false)
                    setDirty(false)
                    setRevision((value) => value + 1)
                  }}
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
                />
              )}
            </section>
          )}

          {userId && (
            <ProductPhotosEditor
              key={`${userId}:${catalog.tenantId}:${product.id}`}
              userId={userId}
              tenantId={catalog.tenantId}
              productId={product.id}
              archived={archived}
              onPendingChange={onPendingChange}
            />
          )}

          <ProductExtrasTable
            catalog={catalog}
            product={product}
            archived={archived}
            pending={pending}
            onPendingChange={onPendingChange}
          />

          {settings ? (
            <CatalogTranslationsEditor
              {...settings}
              readOnly={archived}
              includeArchived
              onPendingChange={onPendingChange}
              catalog={{
                categories: [],
                products: [product],
                optionGroups: groups,
                options: catalog.options.filter((option) =>
                  groups.some((group) => group.id === option.groupId)
                ),
              }}
            />
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {t("languagesUnavailable")}
            </p>
          )}
        </fieldset>
      </SheetContent>
    </Sheet>
  )
}
