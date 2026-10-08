"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  Layers3,
  Plus,
  ChevronRight,
  Search,
  ArrowDownUp,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { setCategoryVisibilityAction } from "@/actions/catalog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EditorDialog } from "@/components/ui/editor-dialog"
import { ResultMessage } from "@/components/auth/result-message"
import type {
  CatalogCategory,
  ManagedCatalog,
} from "@/types/catalog-management"
import { CategoryForm } from "./category-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"
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
  const [search, setSearch] = useState("")
  const categories = [...catalog.categories]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .filter((item) =>
      item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
    )

  const selected = categories.find((item) => item.id === selectedId)

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg">
            <Layers3 aria-hidden="true" className="size-5" />

            {u("categories")}
          </h2>
        </CardTitle>

        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium whitespace-nowrap">
          {u("categoryCount", {
            count: catalog.categories.filter((item) => !item.isArchived).length,
          })}
        </span>
      </CardHeader>

      <CardContent className="grid gap-4">
        <div className="relative">
          <Label htmlFor="builder-category-search" className="sr-only">
            {u("categorySearch")}
          </Label>

          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted-foreground"
          />

          <Input
            id="builder-category-search"
            value={search}
            disabled={pending}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={u("categorySearch")}
            className="pl-9"
          />
        </div>

        <Button
          variant={selectedId === "all" ? "secondary" : "ghost"}
          aria-pressed={selectedId === "all"}
          disabled={pending}
          onClick={() => onSelect("all")}
        >
          {u("allCategories")}
        </Button>

        <ul className="grid gap-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className={
                selectedId === category.id
                  ? "min-w-0 rounded-lg bg-obsidian text-on-primary"
                  : "min-w-0 rounded-lg bg-muted text-foreground dark:bg-secondary"
              }
            >
              <div className="flex min-w-0 flex-wrap items-center gap-0.5 p-1">
                <Button
                  className="h-auto min-w-0 flex-1 justify-start gap-2 px-2 py-3 text-left text-inherit hover:bg-secondary hover:text-secondary-foreground"
                  variant="ghost"
                  aria-label={category.name}
                  aria-pressed={selectedId === category.id}
                  disabled={pending}
                  onClick={() => onSelect(category.id)}
                >
                  <span className="grid min-w-0 gap-1">
                    <span
                      className="truncate font-semibold"
                      title={category.name}
                    >
                      {category.name}
                    </span>

                    <span className="text-xs font-normal opacity-80">
                      {category.isArchived
                        ? t("archived")
                        : !category.isVisible
                          ? u("hidden")
                          : u("categoryProductCount", {
                              count: catalog.products.filter(
                                (item) =>
                                  item.categoryId === category.id &&
                                  !item.isArchived
                              ).length,
                            })}
                    </span>
                  </span>
                </Button>

                {!category.isArchived && (
                  <CategoryVisibility
                    category={category}
                    tenantId={catalog.tenantId}
                    busy={pending}
                    onPendingChange={onPendingChange}
                  />
                )}

                <ChevronRight
                  aria-hidden="true"
                  className="mr-1 size-4 shrink-0 opacity-60"
                />
              </div>
            </li>
          ))}
        </ul>

        {selected && !selected.isArchived && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowDownUp aria-hidden="true" className="size-3.5" />

              {u("order", { value: selected.sortOrder })}
            </span>

            <div className="flex gap-1">
              <EditorDialog
                compact
                title={t("editCategory", { name: selected.name })}
                label={u("editCategory")}
                description={u("categoryHelp")}
                disabled={pending}
              >
                {(callbacks) => (
                  <CategoryForm
                    tenantId={catalog.tenantId}
                    category={selected}
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
                id={selected.id}
                entityType="categories"
                name={selected.name}
              />
            </div>
          </div>
        )}

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">{u("noCategories")}</p>
        )}

        <EditorDialog
          icon={Plus}
          title={t("newCategory")}
          label={t("newCategory")}
          description={u("categoryHelp")}
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
        className="text-inherit hover:bg-secondary hover:text-secondary-foreground"
        aria-busy={pending}
        disabled={busy || pending}
        aria-label={t(
          category.isVisible ? "hideCategoryNamed" : "showCategoryNamed",
          { name: category.name }
        )}
      >
        <Icon aria-hidden="true" className="size-4" />

        <span className="sr-only">
          {t(category.isVisible ? "visible" : "hidden")}
        </span>
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
