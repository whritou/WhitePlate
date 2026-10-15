import type {
  CatalogCategory,
  CatalogProduct,
} from "@/types/catalog-management"
import type {
  MenuBuilderDraggedItem,
  MenuBuilderReorderInput,
} from "@/types/menu-builder"

export function useMenuBuilderOrdering({
  categories,
  products,
  categoryId,
  visibility,
  pending,
  dragged,
  isArchived,
  reorder,
}: {
  categories: CatalogCategory[]
  products: CatalogProduct[]
  categoryId: string
  visibility: string
  pending: boolean
  dragged: MenuBuilderDraggedItem | null
  isArchived: (product: CatalogProduct) => boolean
  reorder: (input: MenuBuilderReorderInput) => void
}) {
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
        orderedIds: ordered.map((category) => category.id),
      })

      return
    }

    const targetCategory = categories.find(
      (category) => category.id === targetId
    )
    const product = products.find((item) => item.id === dragged.id)

    if (
      !targetCategory ||
      targetCategory.isArchived ||
      !product ||
      isArchived(product) ||
      product.categoryId === targetId
    )
      return

    const orderedIds = products
      .filter((item) => item.categoryId === targetId && !isArchived(item))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((item) => item.id)

    orderedIds.push(product.id)
    reorder({
      entityType: "products",
      categoryId: targetId,
      orderedIds,
      movedProductId: product.id,
    })
  }

  function dropProduct(targetId: string) {
    if (
      !dragged ||
      dragged.kind !== "product" ||
      dragged.id === targetId ||
      pending ||
      visibility !== "active"
    )
      return

    const target = products.find((item) => item.id === targetId)
    const destinationCategoryId =
      categoryId === "all" ? target?.categoryId : categoryId

    if (!target || !destinationCategoryId || isArchived(target)) return

    const active = products
      .filter(
        (item) => item.categoryId === destinationCategoryId && !isArchived(item)
      )
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const from = active.findIndex((item) => item.id === dragged.id)
    const to = active.findIndex((item) => item.id === targetId)

    if (to < 0) return

    const ordered = [...active]
    const [item] =
      from >= 0
        ? ordered.splice(from, 1)
        : [products.find((product) => product.id === dragged.id)]

    if (!item || isArchived(item)) return
    ordered.splice(to, 0, item)
    reorder({
      entityType: "products",
      categoryId: destinationCategoryId,
      orderedIds: ordered.map((product) => product.id),
      movedProductId:
        item.categoryId === destinationCategoryId ? undefined : item.id,
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
    if (visibility !== "active") return

    const product = products.find((item) => item.id === id)
    const destinationCategoryId =
      categoryId === "all" ? product?.categoryId : categoryId

    if (!product || !destinationCategoryId) return

    const active = products
      .filter(
        (item) => item.categoryId === destinationCategoryId && !isArchived(item)
      )
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
      categoryId: destinationCategoryId,
      orderedIds: ordered.map((item) => item.id),
    })
  }

  return {
    dropCategory,
    dropProduct,
    moveCategoryWithKeyboard,
    moveProductWithKeyboard,
  }
}
