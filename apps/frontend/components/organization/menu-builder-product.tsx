"use client"

import { useRef, useState } from "react"
import { RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { CatalogProduct, ManagedCatalog } from "@/types/catalog-management"
import { ProductForm } from "./product-form"
import { OptionGroupsEditor } from "./option-groups-editor"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreProductButton } from "./restore-product-button"
import { ProductPhotosEditor } from "./product-photos-editor"

export function MenuBuilderProduct({
  userId,
  catalog,
  product,
  pending,
  onPendingChange,
}: {
  userId?: string
  catalog: ManagedCatalog
  product: CatalogProduct
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const category = catalog.categories.find(
    (item) => item.id === product.categoryId
  )
  const archived = product.isArchived || !!category?.isArchived
  const [dirty, setDirty] = useState(false)
  const [revision, setRevision] = useState(0)
  const editor = useRef<HTMLDivElement>(null)

  function discard() {
    setRevision((value) => value + 1)
    setDirty(false)
    requestAnimationFrame(() =>
      editor.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus()
    )
  }

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-3 inline-flex rounded-md bg-secondary-fixed px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground uppercase">
              {t("productEditor")}
            </p>

            <CardTitle>
              <h2 className="text-2xl leading-snug break-words">
                {product.name}
              </h2>
            </CardTitle>

            <CardDescription className="mt-2">{category?.name}</CardDescription>

            {!archived && (
              <p role="status" className="mt-1 text-xs text-muted-foreground">
                {t(dirty ? "unsaved" : "savedFields")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted px-4 py-3">
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
              <Button
                variant="ghost"
                size="icon"
                disabled={!dirty || pending}
                onClick={discard}
                aria-label={t("discardProduct")}
                title={t("discardProduct")}
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </Button>
            )}

            {!archived && (
              <ArchiveCatalogButton
                compact
                tenantId={catalog.tenantId}
                id={product.id}
                entityType="products"
                name={product.name}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="@container grid gap-5">
          {!category?.isVisible && !category?.isArchived && (
            <p className="text-sm text-warning">{t("categoryHiddenHelp")}</p>
          )}

          <div
            className={
              userId
                ? "grid min-w-0 gap-6 @min-[42rem]:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]"
                : undefined
            }
          >
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

            {!archived ? (
              <>
                <div ref={editor} onChange={() => setDirty(true)}>
                  <ProductForm
                    studio
                    key={revision}
                    tenantId={catalog.tenantId}
                    currency={catalog.currency}
                    categories={catalog.categories}
                    product={product}
                    onPendingChange={onPendingChange}
                    onSuccess={() => setDirty(false)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t("archivedHelp")}
                </p>

                {product.isArchived && !category?.isArchived && (
                  <RestoreProductButton
                    tenantId={catalog.tenantId}
                    id={product.id}
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{c("optionGroupsTitle")}</h2>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <OptionGroupsEditor
            tenantId={catalog.tenantId}
            currency={catalog.currency}
            productId={product.id}
            productName={product.name}
            optionGroups={catalog.optionGroups}
            options={catalog.options}
            parentArchived={archived}
            studio
          />
        </CardContent>
      </Card>
    </div>
  )
}
