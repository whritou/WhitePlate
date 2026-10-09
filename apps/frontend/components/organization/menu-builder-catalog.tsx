"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { EditorDialog } from "@/components/ui/editor-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ManagedCatalog } from "@/types/catalog-management"
import type { MenuLanguageSettings } from "@/types/catalog"
import { MenuBuilderCategories } from "./menu-builder-categories"
import { MenuBuilderProduct } from "./menu-builder-product"
import { ProductForm } from "./product-form"
import { CategoryForm } from "./category-form"
import { CatalogOrderForm } from "./catalog-order-form"

export function MenuBuilderCatalog({
  userId,
  catalog,
  settings,
  pending,
  onPendingChange,
}: {
  userId?: string
  catalog: ManagedCatalog
  settings?: MenuLanguageSettings
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const locale = useLocale()
  const [categoryId, setCategoryId] = useState("all")
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
    <div className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[36rem] min-w-0 flex-1 basis-64 text-sm text-muted-foreground">
          {t("intro")}
        </p>

        <div className="flex flex-wrap gap-2">
          <EditorDialog
            primary
            icon={Plus}
            title={c("newProduct")}
            label={c("newProduct")}
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
        </div>
      </div>

      <fieldset
        disabled={pending}
        aria-label={t("products")}
        aria-busy={pending}
        className="grid min-w-0 gap-6"
      >
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>
              <h2>{u("products")}</h2>
            </CardTitle>
          </CardHeader>

          <CardContent className="grid min-w-0 gap-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="builder-product-search">{u("search")}</Label>

                <Input
                  id="builder-product-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={u("searchPlaceholder")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="builder-product-visibility">{u("show")}</Label>

                <NativeSelect
                  id="builder-product-visibility"
                  value={visibility}
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

              <div className="grid gap-2">
                <Label htmlFor="builder-category-filter">{c("category")}</Label>

                <NativeSelect
                  id="builder-category-filter"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  selectClassName="w-full"
                >
                  <NativeSelectOption value="all">
                    {u("allCategories")}
                  </NativeSelectOption>

                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <p role="status" className="text-sm text-muted-foreground">
              {u("productCount", { count: products.length })}
            </p>

            <p className="text-xs text-muted-foreground">{t("orderingHelp")}</p>

            <Table aria-label={u("products")}>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">{c("name")}</TableHead>

                  <TableHead scope="col">{c("category")}</TableHead>

                  <TableHead scope="col">
                    {c("price", { currency: catalog.currency })}
                  </TableHead>

                  <TableHead scope="col">{t("status")}</TableHead>

                  <TableHead scope="col">{c("sortOrder")}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="min-w-48">
                      <Button
                        variant="ghost"
                        className="h-auto justify-start px-0 text-left whitespace-normal"
                        disabled={pending}
                        aria-label={t("selectProduct", { name: product.name })}
                        onClick={() => selectProduct(product.id)}
                      >
                        {product.name}
                      </Button>
                    </TableCell>

                    <TableCell>
                      {
                        categories.find(
                          (item) => item.id === product.categoryId
                        )?.name
                      }
                    </TableCell>

                    <TableCell className="whitespace-nowrap tabular-nums">
                      {money.format(product.basePrice)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          isArchived(product)
                            ? "neutral"
                            : product.isAvailable
                              ? "success"
                              : "warning"
                        }
                      >
                        {c(
                          isArchived(product)
                            ? "archived"
                            : product.isAvailable
                              ? "available"
                              : "unavailable"
                        )}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {isArchived(product) ? (
                        product.sortOrder
                      ) : (
                        <CatalogOrderForm
                          tenantId={catalog.tenantId}
                          item={product}
                          pending={pending}
                          onPendingChange={onPendingChange}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {products.length === 0 && (
              <p className="py-4 text-muted-foreground">{u("noProducts")}</p>
            )}
          </CardContent>
        </Card>

        <MenuBuilderCategories
          catalog={catalog}
          selectedId={categoryId}
          onSelect={setCategoryId}
          pending={pending}
          onPendingChange={onPendingChange}
        />
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
              if (!value && !pending) setSelectedId("")
            }}
            pending={pending}
            onPendingChange={onPendingChange}
          />
        ))}
    </div>
  )
}
