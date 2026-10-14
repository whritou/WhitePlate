"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { reorderCatalogAction } from "@/actions/catalog"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type { CatalogProduct, ManagedCatalog } from "@/types/catalog-management"
import type { ProductExtrasDraggedItem } from "@/types/menu-builder"
import { OptionGroupForm } from "./option-group-form"
import { ProductOptionGroupCard } from "./product-option-group-card"

export function ProductExtrasTable({
  catalog,
  product,
  archived,
  pending,
  onPendingChange,
}: {
  catalog: ManagedCatalog
  product: CatalogProduct
  archived: boolean
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const m = useTranslations("MenuBuilder")
  const router = useRouter()
  const locale = useLocale()
  const [dragged, setDragged] = useState<ProductExtrasDraggedItem | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [saving, startTransition] = useTransition()
  const groups = catalog.optionGroups
    .filter((group) => group.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: catalog.currency,
  })

  function reorder(entityType: "option-groups" | "options", parentId: string, orderedIds: string[]) {
    if (pending || saving || orderedIds.length === 0) return

    const input = new FormData()

    input.set("tenantId", catalog.tenantId)
    input.set("entityType", entityType)
    input.set("parentId", parentId)
    orderedIds.forEach((id) => input.append("orderedIds", id))
    setOrderError(null)
    onPendingChange(true)
    startTransition(async () => {
      try {
        const result = await reorderCatalogAction(input)

        if (!result.ok) {
          setOrderError(result.error)

          return
        }

        router.refresh()
      } catch {
        setOrderError("unavailable")
      } finally {
        onPendingChange(false)
        setDragged(null)
      }
    })
  }

  function dropGroup(targetId: string) {
    if (!dragged || dragged.type !== "option-groups" || dragged.id === targetId || archived) return

    const active = groups.filter((group) => !group.isArchived)
    const from = active.findIndex((group) => group.id === dragged.id)
    const to = active.findIndex((group) => group.id === targetId)

    if (from < 0 || to < 0) return

    const ordered = [...active]
    const [item] = ordered.splice(from, 1)

    if (!item) return
    ordered.splice(to, 0, item)
    reorder("option-groups", product.id, ordered.map((group) => group.id))
  }

  function moveGroupWithKeyboard(id: string, offset: number) {
    if (archived) return

    const active = groups.filter((group) => !group.isArchived)
    const from = active.findIndex((group) => group.id === id)
    const to = from + offset

    if (from < 0 || to < 0 || to >= active.length) return

    const ordered = [...active]
    const [item] = ordered.splice(from, 1)

    if (!item) return
    ordered.splice(to, 0, item)
    reorder("option-groups", product.id, ordered.map((group) => group.id))
  }

  function moveOptionWithKeyboard(groupId: string, id: string, offset: number) {
    const active = catalog.options
      .filter((option) => option.groupId === groupId && !option.isArchived)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    const from = active.findIndex((option) => option.id === id)
    const to = from + offset

    if (from < 0 || to < 0 || to >= active.length) return

    const ordered = [...active]
    const [item] = ordered.splice(from, 1)

    if (!item) return
    ordered.splice(to, 0, item)
    reorder("options", groupId, ordered.map((option) => option.id))
  }

  return (
    <section aria-label={m("extras")} className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{m("extras")}</h2>

        {!archived && (
          <EditorDialog
            sourcePrimary
            icon={Plus}
            title={t("newOptionGroupFor", { name: product.name })}
            label={u("addGroup")}
            description={u("groupEditorHelp")}
            disabled={pending}
          >
            {(callbacks) => (
              <OptionGroupForm
                tenantId={catalog.tenantId}
                productId={product.id}
                productName={product.name}
                {...callbacks}
                onPendingChange={(value) => {
                  callbacks.onPendingChange?.(value)
                  onPendingChange(value)
                }}
              />
            )}
          </EditorDialog>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{t("optionGroupsDescription")}</p>

      {orderError && (
        <p role="alert" className="text-sm text-destructive">
          {t(`errors.${orderError}`)}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{t("noOptionGroups")}</p>
      ) : (
        <ul className="grid gap-3">
          {groups.map((group) => {
            const options = catalog.options
              .filter((option) => option.groupId === group.id)
              .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))

            return (
              <ProductOptionGroupCard
                key={group.id}
                group={group}
                options={options}
                catalog={catalog}
                product={product}
                archived={archived}
                pending={pending}
                dragged={dragged}
                money={money}
                setDragged={setDragged}
                onDropGroup={dropGroup}
                moveGroupWithKeyboard={moveGroupWithKeyboard}
                moveOptionWithKeyboard={moveOptionWithKeyboard}
                reorder={reorder}
                onPendingChange={onPendingChange}
              />
            )
          })}
        </ul>
      )}
    </section>
  )
}
