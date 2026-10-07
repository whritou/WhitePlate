"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Layers3, Package, Plus, Search, TicketPercent } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { ManagedCatalog } from "@/types/catalog-management"
import { CategoryForm } from "./category-form"
import { ProductForm } from "./product-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { DiscountsEditor } from "./discounts-editor"
import { CatalogProductRow } from "./catalog-product-row"

export function CatalogWorkspace({ catalog }: { catalog: ManagedCatalog }) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState("all")
  const [visibility, setVisibility] = useState("active")
  const categories = [...catalog.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  )
  const activeCategories = categories.filter((category) => !category.isArchived)
  const products = [...catalog.products]
    .filter((product) => {
      const parent = categories.find(
        (category) => category.id === product.categoryId
      )
      const archived = product.isArchived || parent?.isArchived

      return (
        (visibility === "all" ||
          (visibility === "archived" ? archived : !archived)) &&
        (categoryId === "all" || product.categoryId === categoryId) &&
        product.name
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase())
      )
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

  return (
    <Tabs defaultValue="products">
      <TabsList aria-label={u("sections")}>
        <TabsTrigger value="products">
          <Package aria-hidden="true" className="size-4" />

          {u("products")}
        </TabsTrigger>

        <TabsTrigger value="categories">
          <Layers3 aria-hidden="true" className="size-4" />

          {u("categories")}
        </TabsTrigger>

        <TabsTrigger value="discounts">
          <TicketPercent aria-hidden="true" className="size-4" />

          {u("discounts")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>
                <h2>{u("products")}</h2>
              </CardTitle>

              <CardDescription className="mt-2">
                {u("productsHelp")}
              </CardDescription>
            </div>

            <EditorDialog
              primary
              icon={Plus}
              title={t("newProduct")}
              label={t("newProduct")}
              description={u("productEditorHelp")}
              disabled={activeCategories.length === 0}
            >
              {(callbacks) => (
                <ProductForm
                  tenantId={catalog.tenantId}
                  currency={catalog.currency}
                  categories={categories}
                  {...callbacks}
                />
              )}
            </EditorDialog>
          </CardHeader>

          <CardContent className="grid gap-5">
            {activeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("categoryRequired")}
              </p>
            )}

            <div className="grid items-end gap-4 border-b border-border pb-5 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.65fr)_minmax(10rem,0.65fr)]">
              <div className="grid gap-2">
                <Label htmlFor="catalog-search">{u("search")}</Label>

                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="absolute top-3 left-3 size-5 text-muted-foreground"
                  />

                  <Input
                    id="catalog-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={u("searchPlaceholder")}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="catalog-category">{t("category")}</Label>

                <NativeSelect
                  id="catalog-category"
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

              <div className="grid gap-2">
                <Label htmlFor="catalog-visibility">{u("show")}</Label>

                <NativeSelect
                  id="catalog-visibility"
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value)}
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
            </div>

            <p role="status" className="text-sm text-muted-foreground">
              {u("productCount", { count: products.length })}
            </p>

            {products.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {u("noProducts")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {products.map((product) => (
                  <li key={product.id}>
                    <CatalogProductRow catalog={catalog} product={product} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <Card>
          <CardHeader className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>
                <h2>{u("categories")}</h2>
              </CardTitle>

              <CardDescription className="mt-2">
                {u("categoriesHelp")}
              </CardDescription>
            </div>

            <EditorDialog
              primary
              icon={Plus}
              title={t("newCategory")}
              label={t("newCategory")}
              description={u("categoryEditorHelp")}
            >
              {(callbacks) => (
                <CategoryForm tenantId={catalog.tenantId} {...callbacks} />
              )}
            </EditorDialog>
          </CardHeader>

          <CardContent>
            {categories.length === 0 ? (
              <p className="py-6 text-muted-foreground">{t("empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className="flex flex-wrap items-center justify-between gap-4 py-5"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold break-words">
                        {category.name}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {u("categorySummary", {
                          count: catalog.products.filter(
                            (p) =>
                              p.categoryId === category.id &&
                              !p.isArchived &&
                              !category.isArchived
                          ).length,
                          order: category.sortOrder,
                        })}
                      </p>

                      {category.isArchived && (
                        <Badge variant="neutral">{t("archived")}</Badge>
                      )}
                    </div>

                    {!category.isArchived && (
                      <div className="flex flex-wrap gap-2">
                        <EditorDialog
                          title={t("editCategory", { name: category.name })}
                          label={u("edit")}
                          description={u("categoryEditorHelp")}
                        >
                          {(callbacks) => (
                            <CategoryForm
                              tenantId={catalog.tenantId}
                              category={category}
                              {...callbacks}
                            />
                          )}
                        </EditorDialog>

                        <ArchiveCatalogButton
                          tenantId={catalog.tenantId}
                          id={category.id}
                          entityType="categories"
                          name={category.name}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="discounts">
        <DiscountsEditor
          tenantId={catalog.tenantId}
          currency={catalog.currency}
          discounts={catalog.discounts}
        />
      </TabsContent>
    </Tabs>
  )
}
