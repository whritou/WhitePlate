"use client"

import { useRef, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { reorderCatalogAction } from "@/actions/catalog"
import type { ManagedCatalog } from "@/types/catalog-management"
import type { MenuBuilderDraggedItem } from "@/types/menu-builder"
import { MenuBuilderProduct } from "./menu-builder-product"
import { MenuBuilderCategoryList } from "./menu-builder-category-list"
import { MenuBuilderProductList } from "./menu-builder-product-list"

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
  const v = useTranslations("LiveParity")
  const locale = useLocale()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [visibility, setVisibility] = useState("active")
  const [selectedId, setSelectedId] = useState("")
  const [visited, setVisited] = useState<string[]>([])
  const [dragged, setDragged] = useState<MenuBuilderDraggedItem | null>(null)
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
      reorder({
        entityType: "categories",
        orderedIds: ordered.map((x) => x.id),
      })

      return
    }

    const targetCategory = categories.find(
      (category) => category.id === targetId
    )
    const product = catalog.products.find((item) => item.id === dragged.id)

    if (
      !targetCategory ||
      targetCategory.isArchived ||
      !product ||
      isArchived(product)
    )
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
    reorder({
      entityType: "categories",
      orderedIds: ordered.map((category) => category.id),
    })
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
    reorder({
      entityType: "products",
      categoryId,
      orderedIds: ordered.map((product) => product.id),
    })
  }

  return (
    <div className="grid min-w-0 gap-0">
      <div
        className={`live-menu-layout grid min-w-0 ${selectedId ? "has-product" : ""}`}
      >
        <MenuBuilderCategoryList
          catalog={catalog}
          categories={categories}
          categoryId={categoryId}
          pending={pending}
          onCategoryChange={onCategoryChange}
          setSelectedId={setSelectedId}
          dragged={dragged}
          dropCategory={dropCategory}
          onPendingChange={onPendingChange}
          setDragged={setDragged}
          moveCategoryWithKeyboard={moveCategoryWithKeyboard}
        />

        <MenuBuilderProductList
          userId={userId}
          catalog={catalog}
          categories={categories}
          categoryId={categoryId}
          pending={pending}
          reorderPending={reorderPending}
          search={search}
          setSearch={setSearch}
          visibility={visibility}
          setVisibility={setVisibility}
          onPendingChange={onPendingChange}
          products={products}
          reorderError={reorderError}
          dragged={dragged}
          setDragged={setDragged}
          isArchived={isArchived}
          dropProduct={dropProduct}
          selectedId={selectedId}
          selectProduct={selectProduct}
          money={money}
          moveProductWithKeyboard={moveProductWithKeyboard}
        />

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
            <h2 className="font-display text-xl font-bold">
              {v("selectDish")}
            </h2>
          </section>
        )}
      </div>
    </div>
  )
}
