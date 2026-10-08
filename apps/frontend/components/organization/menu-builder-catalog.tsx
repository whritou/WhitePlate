"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { ManagedCatalog } from "@/types/catalog-management"
import { MenuBuilderCategories } from "./menu-builder-categories"
import { MenuBuilderProduct } from "./menu-builder-product"
import { ProductForm } from "./product-form"

export function MenuBuilderCatalog({
  catalog,
  pending,
  onPendingChange,
}: {
  catalog: ManagedCatalog
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const locale = useLocale()
  const first = [...catalog.products]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .find(
      (item) =>
        !item.isArchived &&
        !catalog.categories.find((category) => category.id === item.categoryId)
          ?.isArchived
    )
  const [categoryId, setCategoryId] = useState(first?.categoryId ?? "all")
  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState("active")
  const [selectedId, setSelectedId] = useState(first?.id ?? "")
  const [visited, setVisited] = useState(first ? [first.id] : [])
  const products = [...catalog.products]
    .filter((product) => {
      const archived =
        product.isArchived ||
        catalog.categories.find(
          (category) => category.id === product.categoryId
        )?.isArchived

      return (
        (categoryId === "all" || product.categoryId === categoryId) &&
        (visibility === "all" ||
          (visibility === "archived" ? archived : !archived)) &&
        product.name
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase())
      )
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  const selectedVisible = products.some((item) => item.id === selectedId)
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
    <fieldset
      disabled={pending}
      aria-label={t("products")}
      aria-busy={pending}
      className="grid min-w-0 items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]"
    >
      <aside className="grid min-w-0 gap-5">
        <MenuBuilderCategories
          catalog={catalog}
          selectedId={categoryId}
          onSelect={setCategoryId}
          pending={pending}
          onPendingChange={onPendingChange}
        />

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>
              <h2>{u("products")}</h2>
            </CardTitle>

            <EditorDialog
              compact
              icon={Plus}
              title={c("newProduct")}
              label={c("newProduct")}
              description={u("productEditorHelp")}
              disabled={
                pending || !catalog.categories.some((item) => !item.isArchived)
              }
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
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="builder-product-search">{u("search")}</Label>

                <Input
                  id="builder-product-search"
                  value={search}
                  disabled={pending}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={u("searchPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="builder-product-visibility">{u("show")}</Label>

                <NativeSelect
                  id="builder-product-visibility"
                  value={visibility}
                  disabled={pending}
                  onChange={(event) => setVisibility(event.target.value)}
                  selectClassName="w-full"
                >
                  <NativeSelectOption value="active">
                    {u("activeProducts")}
                  </NativeSelectOption>

                  <NativeSelectOption value="archived">
                    {c("archived")}
                  </NativeSelectOption>

                  <NativeSelectOption value="all">
                    {u("allProducts")}
                  </NativeSelectOption>
                </NativeSelect>
              </div>
            </div>

            <p role="status" className="text-sm text-muted-foreground">
              {u("productCount", { count: products.length })}
            </p>

            <ul className="grid gap-2">
              {products.map((product) => (
                <li key={product.id} className="min-w-0">
                  <Button
                    variant={
                      selectedId === product.id ? "secondary" : "outline"
                    }
                    className="h-full w-full flex-wrap justify-between gap-2 p-3 text-left text-sm"
                    disabled={pending}
                    aria-pressed={selectedId === product.id}
                    aria-label={t("selectProduct", { name: product.name })}
                    onClick={() => selectProduct(product.id)}
                  >
                    <span className="min-w-0 break-words">{product.name}</span>

                    <span className="text-sm tabular-nums">
                      {money.format(product.basePrice)}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>

            {products.length === 0 && (
              <p className="py-4 text-muted-foreground">{u("noProducts")}</p>
            )}
          </CardContent>
        </Card>
      </aside>

      <div className="grid min-w-0 gap-6">
        {!selectedVisible && (
          <p
            role="status"
            className="rounded-md border border-border bg-card p-6 text-muted-foreground"
          >
            {t("selectHelp")}
          </p>
        )}

        {catalog.products
          .filter((product) => visited.includes(product.id))
          .map((product) => (
            <div
              key={product.id}
              hidden={!selectedVisible || product.id !== selectedId}
            >
              <MenuBuilderProduct
                catalog={catalog}
                product={product}
                pending={pending}
                onPendingChange={onPendingChange}
              />
            </div>
          ))}
      </div>
    </fieldset>
  )
}
