"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { setCategoryVisibilityAction } from "@/actions/catalog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EditorDialog } from "@/components/ui/editor-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResultMessage } from "@/components/auth/result-message"
import type {
  CatalogCategory,
  ManagedCatalog,
} from "@/types/catalog-management"
import { CategoryForm } from "./category-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { CatalogOrderForm } from "./catalog-order-form"
import { useCatalogForm } from "./use-catalog-form"

export function MenuBuilderCategories({
  catalog,
  selectedId,
  onSelect,
  pending,
  onPendingChange,
}: {
  catalog: ManagedCatalog
  selectedId: string
  onSelect: (id: string) => void
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("MenuBuilder")
  const v = useTranslations("CatalogView")
  const [search, setSearch] = useState("")
  const categories = [...catalog.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .filter((item) =>
      item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-wrap items-center justify-between gap-4">
        <CardTitle>
          <h2>{u("categories")}</h2>
        </CardTitle>

        <div className="grid gap-2">
          <Label htmlFor="builder-category-search" className="sr-only">
            {u("categorySearch")}
          </Label>

          <Input
            id="builder-category-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            disabled={pending}
            placeholder={u("categorySearch")}
          />
        </div>
      </CardHeader>

      <CardContent className="grid min-w-0 gap-4">
        <Table aria-label={u("categories")}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">{t("name")}</TableHead>

              <TableHead scope="col">{v("products")}</TableHead>

              <TableHead scope="col">{u("status")}</TableHead>

              <TableHead scope="col">{t("sortOrder")}</TableHead>

              <TableHead scope="col">{u("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="min-w-40">
                  <Button
                    variant="ghost"
                    className="h-auto px-0 text-left whitespace-normal"
                    aria-pressed={selectedId === category.id}
                    disabled={pending}
                    onClick={() => onSelect(category.id)}
                  >
                    {category.name}
                  </Button>
                </TableCell>

                <TableCell>
                  {
                    catalog.products.filter(
                      (item) =>
                        item.categoryId === category.id && !item.isArchived
                    ).length
                  }
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      category.isArchived
                        ? "neutral"
                        : category.isVisible
                          ? "success"
                          : "warning"
                    }
                  >
                    {category.isArchived
                      ? t("archived")
                      : u(category.isVisible ? "visible" : "hidden")}
                  </Badge>
                </TableCell>

                <TableCell>
                  {category.isArchived ? (
                    category.sortOrder
                  ) : (
                    <CatalogOrderForm
                      tenantId={catalog.tenantId}
                      item={category}
                      pending={pending}
                      onPendingChange={onPendingChange}
                    />
                  )}
                </TableCell>

                <TableCell>
                  {!category.isArchived && (
                    <div className="flex flex-wrap gap-2">
                      <CategoryVisibility
                        category={category}
                        tenantId={catalog.tenantId}
                        busy={pending}
                        onPendingChange={onPendingChange}
                      />

                      <EditorDialog
                        compact
                        title={t("editCategory", { name: category.name })}
                        label={u("editCategory")}
                        description={u("categoryHelp")}
                        disabled={pending}
                      >
                        {(callbacks) => (
                          <CategoryForm
                            tenantId={catalog.tenantId}
                            category={category}
                            {...callbacks}
                            onPendingChange={(value) => {
                              callbacks.onPendingChange?.(value)
                              onPendingChange(value)
                            }}
                          />
                        )}
                      </EditorDialog>

                      <ArchiveCatalogButton
                        compact
                        tenantId={catalog.tenantId}
                        id={category.id}
                        entityType="categories"
                        name={category.name}
                        onPendingChange={onPendingChange}
                      />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">{u("noCategories")}</p>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryVisibility({
  category,
  tenantId,
  busy,
  onPendingChange,
}: {
  category: CatalogCategory
  tenantId: string
  busy: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    setCategoryVisibilityAction,
    false,
    undefined,
    undefined,
    onPendingChange
  )
  const Icon = category.isVisible ? Eye : EyeOff

  return (
    <form onSubmit={submit} className="contents">
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={category.id} />

      <input
        type="hidden"
        name="isVisible"
        value={String(!category.isVisible)}
      />

      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-foreground"
        aria-busy={pending}
        disabled={busy || pending}
        aria-label={t(
          category.isVisible ? "hideCategoryNamed" : "showCategoryNamed",
          { name: category.name }
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Button>

      {state.status === "error" && (
        <div className="w-full min-w-0 px-2 pb-2 text-foreground">
          <ResultMessage
            state={state}
            hideSuccess
            message={c(`errors.${state.error ?? "unavailable"}`)}
          />
        </div>
      )}
    </form>
  )
}
