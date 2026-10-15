"use client"

import { Eye, EyeOff, GripVertical, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { setCategoryVisibilityAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type {
  CatalogCategory,
  ManagedCatalog,
} from "@/types/catalog-management"
import type { MenuBuilderDraggedItem } from "@/types/menu-builder"
import { CategoryForm } from "./category-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreCatalogItemButton } from "./restore-catalog-item-button"
import { useCatalogForm } from "./use-catalog-form"

export function MenuBuilderCategoryList({
  catalog,
  products,
  categories,
  categoryId,
  setVisibility,
  pending,
  onCategoryChange,
  setSelectedId,
  dragged,
  dropCategory,
  onPendingChange,
  setDragged,
  moveCategoryWithKeyboard,
}: {
  catalog: ManagedCatalog
  products: ManagedCatalog["products"]
  categories: CatalogCategory[]
  categoryId: string
  setVisibility: (value: string) => void
  pending: boolean
  onCategoryChange: (id: string) => void
  setSelectedId: (id: string) => void
  dragged: MenuBuilderDraggedItem | null
  dropCategory: (id: string) => void
  onPendingChange: (pending: boolean) => void
  setDragged: (item: MenuBuilderDraggedItem | null) => void
  moveCategoryWithKeyboard: (id: string, offset: number) => void
}) {
  const t = useTranslations("MenuBuilder")
  const c = useTranslations("Catalog")
  const u = useTranslations("CatalogView")

  return (
    <aside
      className="live-menu-categories border-b lg:border-r lg:border-b-0"
      aria-label={u("categories")}
    >
      <h2 className="label-mono border-b px-4 py-3 text-muted-foreground">
        {u("categories")}
      </h2>

      <div className="live-menu-category-list">
        <Button
          variant="ghost"
          disabled={pending}
          aria-pressed={categoryId === "all"}
          onClick={() => {
            onCategoryChange("all")
            setSelectedId("")
          }}
          className={`shrink-0 justify-between border-b px-4 py-3 text-left lg:w-full ${categoryId === "all" ? "bg-accent font-bold hover:bg-accent hover:text-accent-foreground" : ""}`}
        >
          {u("allCategories")}
        </Button>

        {categories.map((category) => (
          <div
            key={category.id}
            draggable={!pending && !category.isArchived}
            onDragOver={(event) => {
              // Preventing the default lets the browser dispatch `drop` even
              // if React has not rendered the drag-start state yet.
              if (!pending) event.preventDefault()
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              dropCategory(category.id)
            }}
            onDragStart={(event) => {
              if ((event.target as HTMLElement).closest("[data-no-drag]")) {
                event.preventDefault()

                return
              }

              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData("text/plain", category.id)
              setDragged({ kind: "category", id: category.id })
            }}
            onDragEnd={() => setDragged(null)}
            data-drag-source={dragged?.id === category.id ? "true" : undefined}
            className="live-menu-category-row group border-b px-2"
          >
            <div className="flex min-w-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={pending || category.isArchived}
                aria-label={t("dragCategory", { name: category.name })}
                className="size-8 cursor-grab text-muted-foreground"
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault()
                    moveCategoryWithKeyboard(
                      category.id,
                      event.key === "ArrowUp" ? -1 : 1
                    )
                  }
                }}
              >
                <GripVertical aria-hidden="true" className="size-4" />
              </Button>

              <Button
                variant="ghost"
                disabled={pending}
                aria-pressed={categoryId === category.id}
                onClick={() => {
                  onCategoryChange(category.id)
                  setSelectedId("")
                }}
                className={`min-w-0 flex-1 justify-between px-2 py-3 text-left ${categoryId === category.id ? "bg-accent font-bold hover:bg-accent hover:text-accent-foreground" : ""}`}
              >
                <span className="min-w-0 truncate">{category.name}</span>

                <span className="label-mono">
                  {
                    products.filter(
                      (item) =>
                        item.categoryId === category.id && !item.isArchived
                    ).length
                  }
                </span>
              </Button>

              {category.isArchived ? (
                <RestoreCatalogItemButton
                  compact
                  tenantId={catalog.tenantId}
                  id={category.id}
                  entityType="categories"
                  name={category.name}
                  onPendingChange={onPendingChange}
                  onRestored={() => setVisibility("active")}
                />
              ) : (
                <div
                  data-no-drag="true"
                  className="flex shrink-0 flex-col items-center"
                >
                  <ArchiveCatalogButton
                    compact
                    removeIcon
                    tenantId={catalog.tenantId}
                    id={category.id}
                    entityType="categories"
                    name={category.name}
                    onPendingChange={onPendingChange}
                  />

                  <CategoryVisibilityButton
                    category={category}
                    tenantId={catalog.tenantId}
                    disabled={pending}
                    onPendingChange={onPendingChange}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="live-menu-category-actions">
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
    </aside>
  )
}

function CategoryVisibilityButton({
  category,
  tenantId,
  disabled,
  onPendingChange,
}: {
  category: CatalogCategory
  tenantId: string
  disabled: boolean
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
    <form onSubmit={submit} className="contents" data-no-drag="true">
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
        disabled={disabled || pending}
        aria-label={t(
          category.isVisible ? "hideCategoryNamed" : "showCategoryNamed",
          { name: category.name }
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Button>

      {state.status === "error" && (
        <span role="alert" className="sr-only">
          {c(`errors.${state.error ?? "unavailable"}`)}
        </span>
      )}
    </form>
  )
}
