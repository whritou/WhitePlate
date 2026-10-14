"use client"

import { GripVertical } from "lucide-react"
import { useTranslations } from "next-intl"
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
                draggable={
                  !pending &&
                  visibility === "active" &&
                  categoryId !== "all" &&
                  !isArchived(product)
                }
                onDragStart={() =>
                  setDragged({ kind: "product", id: product.id })
                }
                onDragEnd={() => setDragged(null)}
                onDragOver={(event) => {
                  if (dragged?.kind === "product") event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  dropProduct(product.id)
                }}
                className={`live-dish-row border bg-background p-3 ${selectedId === product.id ? "shadow-[4px_4px_0_0_var(--color-primary)]" : "hover:bg-secondary"} ${dragged?.id === product.id ? "opacity-50" : ""}`}
              >
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                  {!isArchived(product) &&
                    visibility === "active" &&
                    categoryId !== "all" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        draggable={!pending}
                        disabled={pending}
                        aria-label={t("dragProduct", { name: product.name })}
                        className="size-8 cursor-grab text-muted-foreground"
                        onDragStart={(event) => {
                          event.stopPropagation()
                          setDragged({ kind: "product", id: product.id })
                        }}
                        onDragEnd={() => setDragged(null)}
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

                  <span
                    className={`label-mono flex min-h-11 shrink-0 items-center justify-center border px-2 py-1.5 whitespace-nowrap ${!isArchived(product) && product.isAvailable ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-destructive hover:bg-destructive hover:text-destructive-foreground"}`}
                  >
                    {c(
                      isArchived(product)
                        ? "archived"
                        : product.isAvailable
                          ? "available"
                          : "unavailable"
                    )}
                  </span>

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
