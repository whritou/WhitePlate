"use client"

import { useState } from "react"
import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
import { setProductAvailabilityAction } from "@/actions/catalog"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type {
  CatalogCategory,
  CatalogProduct,
  ManagedCatalog,
} from "@/types/catalog-management"
import type { MenuBuilderDraggedItem } from "@/types/menu-builder"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { LiveProductCover } from "./live-product-cover"
import { MenuBuilderToolbar } from "./menu-builder-toolbar"
import { RestoreProductButton } from "./restore-product-button"

export function MenuBuilderProductList({
  userId,
  catalog,
  categories,
  categoryId,
  pending,
  reorderPending,
  search,
  setSearch,
  visibility,
  setVisibility,
  onPendingChange,
  products,
  reorderError,
  dragged,
  setDragged,
  isArchived,
  dropProduct,
  selectedId,
  selectProduct,
  money,
  moveProductWithKeyboard,
}: {
  userId?: string
  catalog: ManagedCatalog
  categories: CatalogCategory[]
  categoryId: string
  pending: boolean
  reorderPending: boolean
  search: string
  setSearch: (value: string) => void
  visibility: string
  setVisibility: (value: string) => void
  onPendingChange: (pending: boolean) => void
  products: CatalogProduct[]
  reorderError: string | null
  dragged: MenuBuilderDraggedItem | null
  setDragged: (item: MenuBuilderDraggedItem | null) => void
  isArchived: (product: CatalogProduct) => boolean
  dropProduct: (id: string) => void
  selectedId: string
  selectProduct: (id: string) => void
  money: Intl.NumberFormat
  moveProductWithKeyboard: (id: string, offset: number) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const u = useTranslations("CatalogView")

  return (
    <fieldset
      disabled={pending}
      aria-label={t("products")}
      aria-busy={pending || reorderPending}
      className="grid min-w-0 gap-6"
    >
      <Card className="min-w-0 gap-0 border-0 p-0">
        <MenuBuilderToolbar
          catalog={catalog}
          category={categories.find((item) => item.id === categoryId)}
          title={
            categories.find((item) => item.id === categoryId)?.name ??
            u("allCategories")
          }
          search={search}
          onSearch={setSearch}
          visibility={visibility}
          onVisibility={setVisibility}
          pending={pending}
          onPendingChange={onPendingChange}
        />

        <CardContent className="grid min-w-0 gap-2 px-6 pt-3 pb-6">
          <p role="status" className="text-sm text-muted-foreground">
            {u("productCount", { count: products.length })}
          </p>

          <p className="text-xs text-muted-foreground">{t("orderingHelp")}</p>

          {reorderError && (
            <p role="alert" className="text-sm text-destructive">
              {c(`errors.${reorderError}`)}
            </p>
          )}

          <ul aria-label={u("products")} className="grid min-w-0 gap-2">
            {products.map((product) => (
              <li
                key={product.id}
                data-product-order-id={product.id}
                draggable={
                  !pending &&
                  visibility === "active" &&
                  categoryId !== "all" &&
                  !isArchived(product)
                }
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", product.id)
                  setDragged({ kind: "product", id: product.id })
                }}
                onDragEnd={() => setDragged(null)}
                onDragOver={(event) => {
                  if (dragged?.kind === "product") event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  dropProduct(product.id)
                }}
                className={`live-dish-row group relative border bg-background p-3 pr-14 ${selectedId === product.id ? "shadow-[4px_4px_0_0_var(--color-primary)]" : "hover:bg-secondary"} ${dragged?.id === product.id ? "opacity-50" : ""}`}
              >
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  {!isArchived(product) &&
                    visibility === "active" &&
                    categoryId !== "all" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        aria-label={t("dragProduct", { name: product.name })}
                        className="size-8 cursor-grab text-muted-foreground"
                        onKeyDown={(event) => {
                          if (
                            event.key === "ArrowUp" ||
                            event.key === "ArrowDown"
                          ) {
                            event.preventDefault()
                            moveProductWithKeyboard(
                              product.id,
                              event.key === "ArrowUp" ? -1 : 1
                            )
                          }
                        }}
                      >
                        <GripVertical aria-hidden="true" className="size-4" />
                      </Button>
                    )}

                  <Button
                    variant="unstyled"
                    className="min-w-0 flex-1 basis-48 justify-start p-0 text-left text-base"
                    disabled={pending}
                    aria-label={t("selectProduct", { name: product.name })}
                    aria-pressed={selectedId === product.id}
                    data-product-selector={product.id}
                    onClick={() => selectProduct(product.id)}
                  >
                    <LiveProductCover
                      userId={userId}
                      tenantId={catalog.tenantId}
                      productId={product.id}
                    />

                    <span className="min-w-0 flex-1 [overflow-wrap:break-word]">
                      <span className="block font-bold [overflow-wrap:break-word]">
                        {product.name}
                      </span>

                      <span className="mt-1 block text-sm font-normal [overflow-wrap:break-word] text-muted-foreground">
                        {product.description}
                      </span>
                    </span>
                  </Button>

                  <span className="font-display text-lg font-bold tabular-nums">
                    {money.format(product.basePrice)}
                  </span>

                  {isArchived(product) ? (
                    <span className="label-mono flex min-h-11 shrink-0 items-center justify-center border px-2 py-1.5 whitespace-nowrap">
                      {c("archived")}
                    </span>
                  ) : (
                    <ProductAvailabilityButton
                      key={`${product.id}:${product.isAvailable}`}
                      tenantId={catalog.tenantId}
                      product={product}
                      disabled={pending}
                      onPendingChange={onPendingChange}
                    />
                  )}

                  {isArchived(product) ? (
                    product.isArchived &&
                    !categories.find((item) => item.id === product.categoryId)
                      ?.isArchived && (
                      <RestoreProductButton
                        compact
                        tenantId={catalog.tenantId}
                        id={product.id}
                        onPendingChange={onPendingChange}
                      />
                    )
                  ) : (
                    <ArchiveCatalogButton
                      compact
                      removeIcon
                      tenantId={catalog.tenantId}
                      id={product.id}
                      entityType="products"
                      name={product.name}
                      onPendingChange={onPendingChange}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>

          {products.length === 0 && (
            <p className="py-4 text-muted-foreground">{u("noProducts")}</p>
          )}
        </CardContent>
      </Card>
    </fieldset>
  )
}

function ProductAvailabilityButton({
  tenantId,
  product,
  disabled,
  onPendingChange,
}: {
  tenantId: string
  product: CatalogProduct
  disabled: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const l = useTranslations("LiveWorkspace")
  const router = useRouter()
  const [available, setAvailable] = useState(product.isAvailable)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function toggleAvailability() {
    if (saving || disabled) return

    const previous = available
    const next = !previous

    setAvailable(next)
    setSaving(true)
    setFailed(false)
    onPendingChange(true)

    try {
      const result = await setProductAvailabilityAction({
        tenantId,
        id: product.id,
        isAvailable: next,
      })

      if (!result.ok) {
        setAvailable(previous)
        setFailed(true)
      } else {
        router.refresh()
      }
    } catch {
      setAvailable(previous)
      setFailed(true)
    } finally {
      setSaving(false)
      onPendingChange(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className={`label-mono min-h-11 shrink-0 border px-2 py-1.5 whitespace-nowrap ${available ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground"}`}
        disabled={disabled || saving}
        aria-label={`${l(available ? "markUnavailable" : "markAvailable")}: ${product.name}`}
        aria-pressed={available}
        aria-busy={saving}
        onClick={() => void toggleAvailability()}
      >
        {saving
          ? l("updatingAvailability")
          : available
            ? t("available")
            : t("unavailable")}
      </Button>

      {failed && (
        <span className="sr-only" role="alert">
          {l("availabilityUpdateFailed")}
        </span>
      )}
    </>
  )
}
