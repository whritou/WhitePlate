"use client"

import { useRef, useState, useTransition } from "react"
import { Eye, EyeOff, GripVertical, Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { setCategoryVisibilityAction, reorderCatalogAction } from "@/actions/catalog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { CatalogCategory, ManagedCatalog } from "@/types/catalog-management"
import { MenuBuilderProduct } from "./menu-builder-product"
import { MenuBuilderToolbar } from "./menu-builder-toolbar"
import { CategoryForm } from "./category-form"
import { LiveProductCover } from "./live-product-cover"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { RestoreCatalogItemButton } from "./restore-catalog-item-button"
import { RestoreProductButton } from "./restore-product-button"
import { useCatalogForm } from "./use-catalog-form"

type DraggedItem = { kind: "category" | "product"; id: string }

export function MenuBuilderCatalog({
  userId,
  catalog,
  pending,
  onPendingChange,
  categoryId,
  onCategoryChange,
}: {
  userId?: string
  catalog: ManagedCatalog
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
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState("active")
  const [selectedId, setSelectedId] = useState("")
  const [visited, setVisited] = useState<string[]>([])
  const [dragged, setDragged] = useState<DraggedItem | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const submitting = useRef(false)
  const [reorderPending, startTransition] = useTransition()
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
    requestAnimationFrame(() => {
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? "instant"
        : "smooth"

      document
        .querySelector<HTMLButtonElement>(`[data-product-selector="${id}"]`)
        ?.scrollIntoView({ block: "center", behavior })
    })
  }

  function reorder(input: {
    entityType: "categories" | "products"
    orderedIds: string[]
    categoryId?: string
  }) {
    if (submitting.current || pending || input.orderedIds.length === 0) return
    const form = new FormData()
    form.set("tenantId", catalog.tenantId)
    form.set("entityType", input.entityType)
    if (input.categoryId) form.set("categoryId", input.categoryId)
    input.orderedIds.forEach((id) => form.append("orderedIds", id))
    submitting.current = true
    setReorderError(null)
    onPendingChange(true)
    startTransition(async () => {
      try {
        const result = await reorderCatalogAction(form)
        if (!result.ok) {
          setReorderError(result.error)
          return
        }
        router.refresh()
      } catch {
        setReorderError("unavailable")
      } finally {
        submitting.current = false
        onPendingChange(false)
        setDragged(null)
      }
    })
  }

  function dropCategory(targetId: string) {
    if (!dragged || dragged.id === targetId || pending) return
    if (dragged.kind === "category") {
      const active = categories.filter((category) => !category.isArchived)
      const from = active.findIndex((category) => category.id === dragged.id)
      const to = active.findIndex((category) => category.id === targetId)
      if (from < 0 || to < 0) return
      const ordered = [...active]
      const [item] = ordered.splice(from, 1)
      if (!item) return
      ordered.splice(to, 0, item)
      reorder({ entityType: "categories", orderedIds: ordered.map((x) => x.id) })
      return
    }

    const targetCategory = categories.find((category) => category.id === targetId)
    const product = catalog.products.find((item) => item.id === dragged.id)
    if (!targetCategory || targetCategory.isArchived || !product || isArchived(product))
      return
    if (product.categoryId === targetId) return
    const targetProducts = catalog.products
      .filter((item) => item.categoryId === targetId && !isArchived(item))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const orderedIds = targetProducts.map((item) => item.id)
    orderedIds.push(product.id)
    reorder({ entityType: "products", categoryId: targetId, orderedIds })
  }

  function dropProduct(targetId: string) {
    if (
      !dragged ||
      dragged.kind !== "product" ||
      dragged.id === targetId ||
      pending ||
      visibility !== "active" ||
      categoryId === "all"
    )
      return
    const activeProducts = catalog.products
      .filter((item) => item.categoryId === categoryId && !isArchived(item))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const from = activeProducts.findIndex((item) => item.id === dragged.id)
    const to = activeProducts.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    const ordered = [...activeProducts]
    const [item] = ordered.splice(from, 1)
    if (!item) return
    ordered.splice(to, 0, item)
    reorder({
      entityType: "products",
      categoryId,
      orderedIds: ordered.map((product) => product.id),
    })
  }

  function moveCategoryWithKeyboard(id: string, offset: number) {
    const active = categories.filter((category) => !category.isArchived)
    const from = active.findIndex((category) => category.id === id)
    const to = from + offset
    if (from < 0 || to < 0 || to >= active.length) return
    const ordered = [...active]
    const [item] = ordered.splice(from, 1)
    if (!item) return
    ordered.splice(to, 0, item)
    reorder({ entityType: "categories", orderedIds: ordered.map((category) => category.id) })
  }

  function moveProductWithKeyboard(id: string, offset: number) {
    if (categoryId === "all" || visibility !== "active") return
    const active = catalog.products
      .filter((item) => item.categoryId === categoryId && !isArchived(item))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const from = active.findIndex((item) => item.id === id)
    const to = from + offset
    if (from < 0 || to < 0 || to >= active.length) return
    const ordered = [...active]
    const [item] = ordered.splice(from, 1)
    if (!item) return
    ordered.splice(to, 0, item)
    reorder({ entityType: "products", categoryId, orderedIds: ordered.map((product) => product.id) })
  }

  return (
    <div className="grid min-w-0 gap-0">
      <div
        className={`live-menu-layout grid min-w-0 ${selectedId ? "has-product" : ""}`}
      >
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
                onDragOver={(event) => {
                  if (dragged) event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  dropCategory(category.id)
                }}
                className={`live-menu-category-row border-b px-2 ${dragged?.id === category.id ? "opacity-50" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    draggable={!category.isArchived && !pending}
                    disabled={pending || category.isArchived}
                    aria-label={t("dragCategory", { name: category.name })}
                    className="size-8 cursor-grab text-muted-foreground"
                    onDragStart={() => setDragged({ kind: "category", id: category.id })}
                    onDragEnd={() => setDragged(null)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                        event.preventDefault()
                        moveCategoryWithKeyboard(category.id, event.key === "ArrowUp" ? -1 : 1)
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
                      {catalog.products.filter(
                        (item) => item.categoryId === category.id && !item.isArchived
                      ).length}
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
                    />
                  ) : (
                    <>
                      <CategoryVisibilityButton
                        category={category}
                        tenantId={catalog.tenantId}
                        busy={pending}
                        onPendingChange={onPendingChange}
                      />
                      <EditorDialog
                        compact
                        title={c("editCategory", { name: category.name })}
                        label={t("editCategory")}
                        description={t("categoryHelp")}
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
                    </>
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

              <p className="text-xs text-muted-foreground">
                {t("orderingHelp")}
              </p>
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
                      !pending && visibility === "active" && categoryId !== "all" && !isArchived(product)
                    }
                    onDragStart={() => setDragged({ kind: "product", id: product.id })}
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
                      {!isArchived(product) && visibility === "active" && categoryId !== "all" && (
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
                            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                              event.preventDefault()
                              moveProductWithKeyboard(product.id, event.key === "ArrowUp" ? -1 : 1)
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
                          <span className="mt-1 block text-sm font-normal text-muted-foreground [overflow-wrap:break-word]">
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
                        !categories.find((item) => item.id === product.categoryId)?.isArchived && (
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

        {catalog.products
          .filter((product) => visited.includes(product.id))
          .map((product) => (
            <MenuBuilderProduct
              key={product.id}
              userId={userId}
              catalog={catalog}
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
          <section className="live-product-placeholder hidden border-l p-8 text-center lg:grid lg:content-center">
            <h2 className="font-display text-xl font-bold">{v("selectDish")}</h2>
          </section>
        )}
      </div>
    </div>
  )
}

function CategoryVisibilityButton({
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
      <input type="hidden" name="isVisible" value={String(!category.isVisible)} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="text-foreground"
        aria-busy={pending}
        disabled={busy || pending}
        aria-label={t(category.isVisible ? "hideCategoryNamed" : "showCategoryNamed", {
          name: category.name,
        })}
      >
        <Icon aria-hidden="true" className="size-4" />
      </Button>
      {state.status === "error" && (
        <span className="sr-only" role="alert">
          {c(`errors.${state.error ?? "unavailable"}`)}
        </span>
      )}
      {pending && <span className="sr-only">{c("saving")}</span>}
    </form>
  )
}
