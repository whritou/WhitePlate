"use client"

import { useRef, useState, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { reorderCatalogAction } from "@/actions/catalog"
import type { ManagedCatalog } from "@/types/catalog-management"
import type {
  MenuBuilderDraggedItem,
  MenuBuilderReorderInput,
} from "@/types/menu-builder"
import { useMenuBuilderOrdering } from "./use-menu-builder-ordering"
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
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [productOrders, setProductOrders] = useState<Record<string, string[]>>(
    {}
  )
  const [productCategoryOverrides, setProductCategoryOverrides] = useState<
    Record<string, string>
  >({})
  const [selectedId, setSelectedId] = useState("")
  const [visited, setVisited] = useState<string[]>([])
  const [dragged, setDragged] = useState<MenuBuilderDraggedItem | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const submitting = useRef(false)
  const [reorderPending, startTransition] = useTransition()
  const categories = [...catalog.categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  )

  if (categoryOrder.length > 0) {
    categories.sort((a, b) => {
      const aOrder = categoryOrder.indexOf(a.id)
      const bOrder = categoryOrder.indexOf(b.id)

      if (aOrder >= 0 && bOrder >= 0) return aOrder - bOrder
      if (aOrder >= 0) return -1
      if (bOrder >= 0) return 1

      return a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
    })
  }

  const effectiveProducts = catalog.products.map((product) => {
    const categoryId = productCategoryOverrides[product.id]

    return categoryId ? { ...product, categoryId } : product
  })
  const isArchived = (product: ManagedCatalog["products"][number]) =>
    product.isArchived ||
    !!categories.find((item) => item.id === product.categoryId)?.isArchived
  const products = [...effectiveProducts]
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
    .sort((a, b) => {
      const categoryOrderDifference =
        categories.findIndex((item) => item.id === a.categoryId) -
        categories.findIndex((item) => item.id === b.categoryId)

      if (categoryOrderDifference !== 0) return categoryOrderDifference

      const order = productOrders[a.categoryId]

      if (order) {
        const aOrder = order.indexOf(a.id)
        const bOrder = order.indexOf(b.id)

        if (aOrder >= 0 && bOrder >= 0) return aOrder - bOrder
      }

      return a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
    })
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

  function reorder(input: MenuBuilderReorderInput) {
    if (submitting.current || pending || input.orderedIds.length === 0) return

    const form = new FormData()

    form.set("tenantId", catalog.tenantId)
    form.set("entityType", input.entityType)
    if (input.categoryId) form.set("categoryId", input.categoryId)
    input.orderedIds.forEach((id) => form.append("orderedIds", id))

    const previousCategoryOrder = categoryOrder
    const previousProductOrders = productOrders
    const previousProductCategoryOverrides = productCategoryOverrides

    if (input.entityType === "categories") setCategoryOrder(input.orderedIds)
    if (input.entityType === "products" && input.categoryId) {
      setProductOrders((current) => ({
        ...current,
        [input.categoryId!]: input.orderedIds,
      }))
      if (input.movedProductId) {
        setProductCategoryOverrides((current) => ({
          ...current,
          [input.movedProductId!]: input.categoryId!,
        }))
      }
    }

    submitting.current = true
    setReorderError(null)
    onPendingChange(true)
    startTransition(async () => {
      try {
        const result = await reorderCatalogAction(form)

        if (!result.ok) {
          setCategoryOrder(previousCategoryOrder)
          setProductOrders(previousProductOrders)
          setProductCategoryOverrides(previousProductCategoryOverrides)
          setReorderError(result.error)

          return
        }

        router.refresh()
      } catch {
        setCategoryOrder(previousCategoryOrder)
        setProductOrders(previousProductOrders)
        setProductCategoryOverrides(previousProductCategoryOverrides)
        setReorderError("unavailable")
      } finally {
        submitting.current = false
        onPendingChange(false)
        setDragged(null)
      }
    })
  }

  const {
    dropCategory,
    dropProduct,
    moveCategoryWithKeyboard,
    moveProductWithKeyboard,
  } = useMenuBuilderOrdering({
    categories,
    products: effectiveProducts,
    categoryId,
    visibility,
    pending,
    dragged,
    isArchived,
    reorder,
  })

  return (
    <div className="grid min-w-0 gap-0">
      <div
        data-dragging={dragged ? "true" : "false"}
        className={`live-menu-layout grid min-w-0 ${selectedId ? "has-product" : ""}`}
      >
        <MenuBuilderCategoryList
          catalog={catalog}
          products={effectiveProducts}
          categories={categories}
          categoryId={categoryId}
          setVisibility={setVisibility}
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

        {effectiveProducts
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
              onProductRestored={() => setVisibility("active")}
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
