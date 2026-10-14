"use client"

import { GripVertical, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditorDialog } from "@/components/ui/editor-dialog"
import type {
  CatalogOption,
  CatalogOptionGroup,
  CatalogProduct,
  ManagedCatalog,
} from "@/types/catalog-management"
import type { ProductExtrasDraggedItem } from "@/types/menu-builder"
import { ArchiveCatalogButton } from "./archive-catalog-button"
import { OptionForm } from "./option-form"
import { OptionGroupForm } from "./option-group-form"
import { RestoreCatalogItemButton } from "./restore-catalog-item-button"

export function ProductOptionGroupCard({
  group,
  options,
  catalog,
  product,
  archived,
  pending,
  dragged,
  money,
  setDragged,
  onDropGroup,
  moveGroupWithKeyboard,
  moveOptionWithKeyboard,
  reorder,
  onPendingChange,
}: {
  group: CatalogOptionGroup
  options: CatalogOption[]
  catalog: ManagedCatalog
  product: CatalogProduct
  archived: boolean
  pending: boolean
  dragged: ProductExtrasDraggedItem | null
  money: Intl.NumberFormat
  setDragged: (item: ProductExtrasDraggedItem | null) => void
  onDropGroup: (id: string) => void
  moveGroupWithKeyboard: (id: string, offset: number) => void
  moveOptionWithKeyboard: (groupId: string, id: string, offset: number) => void
  reorder: (
    entityType: "option-groups" | "options",
    parentId: string,
    orderedIds: string[]
  ) => void
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const m = useTranslations("MenuBuilder")
  const locked = archived || group.isArchived

  return (
    <li
      onDragOver={(event) => {
        if (dragged) event.preventDefault()
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (dragged?.type === "option-groups") onDropGroup(group.id)
      }}
      className={dragged?.id === group.id ? "opacity-50" : undefined}
    >
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div className="flex min-w-0 items-start gap-2">
            {!locked && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                draggable={!pending}
                disabled={pending}
                aria-label={m("dragOptionGroup", { name: group.name })}
                className="size-8 cursor-grab text-muted-foreground"
                onDragStart={() => setDragged({ type: "option-groups", id: group.id })}
                onDragEnd={() => setDragged(null)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault()
                    moveGroupWithKeyboard(group.id, event.key === "ArrowUp" ? -1 : 1)
                  }
                }}
              >
                <GripVertical aria-hidden="true" className="size-4" />
              </Button>
            )}

            <div className="min-w-0">
              <CardTitle>
                <h3 className="break-words text-base font-semibold">{group.name}</h3>
              </CardTitle>

              <CardDescription>
                {t("selectionRule", {
                  min: group.minimumSelections,
                  max: group.maximumSelections,
                })}
              </CardDescription>

              {group.isArchived && <Badge variant="neutral" className="mt-2">{t("archived")}</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {group.isArchived ? (
              !archived && (
                <RestoreCatalogItemButton
                  tenantId={catalog.tenantId}
                  id={group.id}
                  entityType="option-groups"
                  name={group.name}
                  onPendingChange={onPendingChange}
                />
              )
            ) : !archived && (
              <>
                <EditorDialog
                  compact
                  title={t("editOptionGroup", { name: group.name })}
                  label={u("edit")}
                  description={u("groupEditorHelp")}
                  disabled={pending}
                >
                  {(callbacks) => (
                    <OptionGroupForm
                      tenantId={catalog.tenantId}
                      productId={product.id}
                      productName={product.name}
                      group={group}
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
                  id={group.id}
                  entityType="option-groups"
                  name={group.name}
                  onPendingChange={onPendingChange}
                />
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 pt-4">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
          ) : (
            <ul className="grid gap-2">
              {options.map((option) => (
                <li
                  key={option.id}
                  draggable={!locked && !option.isArchived && !pending}
                  onDragStart={() => setDragged({ type: "options", id: option.id })}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(event) => {
                    if (dragged?.type === "options") event.preventDefault()
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (!dragged || dragged.type !== "options" || dragged.id === option.id || locked) return

                    const active = options.filter((item) => !item.isArchived)
                    const from = active.findIndex((item) => item.id === dragged.id)
                    const to = active.findIndex((item) => item.id === option.id)

                    if (from < 0 || to < 0) return

                    const ordered = [...active]
                    const [item] = ordered.splice(from, 1)

                    if (!item) return
                    ordered.splice(to, 0, item)
                    reorder("options", group.id, ordered.map((item) => item.id))
                  }}
                  className={`flex min-w-0 flex-wrap items-center justify-between gap-3 border bg-background p-3 ${dragged?.id === option.id ? "opacity-50" : ""}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {!locked && !option.isArchived && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        draggable={!pending}
                        disabled={pending}
                        aria-label={m("dragOption", { name: option.name })}
                        className="size-8 shrink-0 cursor-grab text-muted-foreground"
                        onDragStart={(event) => {
                          event.stopPropagation()
                          setDragged({ type: "options", id: option.id })
                        }}
                        onDragEnd={() => setDragged(null)}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                            event.preventDefault()
                            moveOptionWithKeyboard(group.id, option.id, event.key === "ArrowUp" ? -1 : 1)
                          }
                        }}
                      >
                        <GripVertical aria-hidden="true" className="size-4" />
                      </Button>
                    )}

                    <span className="min-w-0 break-words font-medium">{option.name}</span>

                    {(locked || option.isArchived) && <Badge variant="neutral">{t("archived")}</Badge>}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="tabular-nums">+{money.format(option.priceAdjustment)}</span>

                    {!locked && (option.isArchived ? (
                      <RestoreCatalogItemButton
                        compact
                        tenantId={catalog.tenantId}
                        id={option.id}
                        entityType="options"
                        name={option.name}
                        onPendingChange={onPendingChange}
                      />
                    ) : (
                      <>
                        <EditorDialog
                          compact
                          title={t("editOption", { name: option.name })}
                          label={u("edit")}
                          description={u("optionEditorHelp")}
                          disabled={pending}
                        >
                          {(callbacks) => (
                            <OptionForm
                              tenantId={catalog.tenantId}
                              currency={catalog.currency}
                              group={group}
                              option={option}
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
                          id={option.id}
                          entityType="options"
                          name={option.name}
                          onPendingChange={onPendingChange}
                        />
                      </>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!locked && (
            <EditorDialog
              icon={Plus}
              title={t("newOptionFor", { name: group.name })}
              label={u("addOption")}
              description={u("optionEditorHelp")}
              disabled={pending}
            >
              {(callbacks) => (
                <OptionForm
                  tenantId={catalog.tenantId}
                  currency={catalog.currency}
                  group={group}
                  {...callbacks}
                  onPendingChange={(value) => {
                    callbacks.onPendingChange?.(value)
                    onPendingChange(value)
                  }}
                />
              )}
            </EditorDialog>
          )}
        </CardContent>
      </Card>
    </li>
  )
}
