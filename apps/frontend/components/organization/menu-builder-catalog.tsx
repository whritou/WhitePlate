"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { EditorDialog } from "@/components/ui/editor-dialog"
import type { ManagedCatalog } from "@/types/catalog-management"
import type { MenuLanguageSettings } from "@/types/catalog"
import { MenuBuilderProduct } from "./menu-builder-product"
import { MenuBuilderToolbar } from "./menu-builder-toolbar"
import { CategoryForm } from "./category-form"
import { LiveProductCover } from "./live-product-cover"
import { CatalogOrderForm } from "./catalog-order-form"

export function MenuBuilderCatalog({
  userId,
  catalog,
  settings,
  pending,
  onPendingChange,
  categoryId,
  onCategoryChange,
}: {
  userId?: string
  catalog: ManagedCatalog
  settings?: MenuLanguageSettings
  pending: boolean
  onPendingChange: (pending: boolean) => void
  categoryId: string
  onCategoryChange: (id: string) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const v = useTranslations("LiveParity")
  const locale = useLocale()
  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState("active")
  const [selectedId, setSelectedId] = useState("")
  const [visited, setVisited] = useState<string[]>([])
  const categories = [...catalog.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  )
  const isArchived = (product: ManagedCatalog["products"][number]) =>
    product.isArchived ||
    !!categories.find((item) => item.id === product.categoryId)?.isArchived
  const products = [...catalog.products]
    .filter(
      (product) =>
        (categoryId === "all" || product.categoryId === categoryId) &&
        (visibility === "all" ||
          (visibility === "archived"
            ? isArchived(product)
            : !isArchived(product))) &&
        product.name
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase())
    )
    .sort(
      (a, b) =>
        categories.findIndex((item) => item.id === a.categoryId) -
          categories.findIndex((item) => item.id === b.categoryId) ||
        a.sortOrder - b.sortOrder ||
        a.id.localeCompare(b.id)
    )
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: catalog.currency,
  })

  function selectProduct(id: string) {
    if (pending) return
    setSelectedId(id)
    setVisited((current) => (current.includes(id) ? current : [...current, id]))
  }

  return (
    <div className="grid min-w-0 gap-0">
      <div
        className={`live-menu-layout grid min-w-0 ${selectedId ? "has-product" : ""}`}
      >
        <aside
          className="live-menu-categories flex gap-0 overflow-x-auto border-b lg:block lg:border-r lg:border-b-0"
          aria-label={u("categories")}
        >
          <h2 className="label-mono border-b px-4 py-3 text-muted-foreground">
            {u("categories")}
          </h2>

          <Button
            variant="ghost"
            disabled={pending}
            aria-pressed={categoryId === "all"}
            onClick={() => {
              onCategoryChange("all")
              setSelectedId("")
            }}
            className={`shrink-0 justify-between border-b px-4 py-3 text-left lg:w-full ${categoryId === "all" ? "bg-accent font-bold hover:bg-accent" : ""}`}
          >
            {u("allCategories")}
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              disabled={pending}
              aria-pressed={categoryId === category.id}
              onClick={() => {
                onCategoryChange(category.id)
                setSelectedId("")
              }}
              className={`shrink-0 justify-between border-b px-4 py-3 text-left lg:w-full ${categoryId === category.id ? "bg-accent font-bold hover:bg-accent" : ""}`}
            >
              <span>{category.name}</span>

              <span className="label-mono">
                {
                  catalog.products.filter(
                    (item) =>
                      item.categoryId === category.id && !item.isArchived
                  ).length
                }
              </span>
            </Button>
          ))}

          <EditorDialog
            icon={Plus}
            title={c("newCategory")}
            label={c("newCategory")}
            description={t("categoryHelp")}
            disabled={pending}
          >
            {(callbacks) => (
              <CategoryForm
                tenantId={catalog.tenantId}
                {...callbacks}
                onPendingChange={(value) => {
                  callbacks.onPendingChange?.(value)
                  onPendingChange(value)
                }}
              />
            )}
          </EditorDialog>
        </aside>

        <fieldset
          disabled={pending}
          aria-label={t("products")}
          aria-busy={pending}
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

              <p className="text-xs text-muted-foreground">
                {t("orderingHelp")}
              </p>

              <ul aria-label={u("products")} className="grid min-w-0 gap-2">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className={`live-dish-row border bg-background p-3 ${selectedId === product.id ? "shadow-[4px_4px_0_0_var(--color-primary)]" : "hover:bg-secondary"}`}
                  >
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
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

                        <span className="min-w-0">
                          <span className="block font-bold">
                            {product.name}
                          </span>

                          <span className="mt-1 block text-sm font-normal text-muted-foreground">
                            {product.description}
                          </span>
                        </span>
                      </Button>

                      <span className="font-display text-lg font-bold tabular-nums">
                        {money.format(product.basePrice)}
                      </span>

                      <span
                        className={`label-mono flex min-h-11 shrink-0 items-center justify-center border px-2 py-1.5 whitespace-nowrap ${!isArchived(product) && product.isAvailable ? "bg-primary text-primary-foreground" : "text-destructive"}`}
                      >
                        {c(
                          isArchived(product)
                            ? "archived"
                            : product.isAvailable
                              ? "available"
                              : "unavailable"
                        )}
                      </span>
                    </div>

                    {!isArchived(product) && (
                      <div className="mt-2 border-t pt-2">
                        <CatalogOrderForm
                          tenantId={catalog.tenantId}
                          item={product}
                          pending={pending}
                          onPendingChange={onPendingChange}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {products.length === 0 && (
                <p className="py-4 text-muted-foreground">{u("noProducts")}</p>
              )}
            </CardContent>
          </Card>
        </fieldset>

        {catalog.products
          .filter((product) => visited.includes(product.id))
          .map((product) => (
            <MenuBuilderProduct
              key={product.id}
              userId={userId}
              catalog={catalog}
              settings={settings}
              product={product}
              open={selectedId === product.id}
              onOpenChange={(value) => {
                if (!value && !pending) {
                  setSelectedId("")
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLButtonElement>(
                        `[data-product-selector="${product.id}"]`
                      )
                      ?.focus()
                  )
                }
              }}
              pending={pending}
              onPendingChange={onPendingChange}
            />
          ))}

        {!selectedId && (
          <section className="live-product-placeholder hidden min-h-[60vh] border-l p-8 text-center lg:grid lg:content-center">
            <h2 className="font-display text-xl font-bold">
              {v("selectDish")}
            </h2>
          </section>
        )}
      </div>
    </div>
  )
}
