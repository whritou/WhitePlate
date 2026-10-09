"use client"

import { Plus } from "lucide-react"
import { Fragment } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CatalogProduct, ManagedCatalog } from "@/types/catalog-management"
import { OptionGroupForm } from "./option-group-form"
import { OptionForm } from "./option-form"
import { ArchiveCatalogButton } from "./archive-catalog-button"

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
  const locale = useLocale()
  const groups = catalog.optionGroups
    .filter((group) => group.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: catalog.currency,
  })

  return (
    <section aria-label={m("extras")} className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{m("extras")}</h2>

        {!archived && (
          <EditorDialog
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

      <Table aria-label={m("extras")}>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">{t("name")}</TableHead>

            <TableHead scope="col">{m("selectionPrice")}</TableHead>

            <TableHead scope="col">{t("sortOrder")}</TableHead>

            <TableHead scope="col">{m("actions")}</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {groups.map((group) => {
            const locked = archived || group.isArchived
            const options = catalog.options
              .filter((option) => option.groupId === group.id)
              .sort(
                (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
              )

            return (
              <Fragment key={group.id}>
                <TableRow className="bg-muted">
                  <TableCell className="min-w-40 font-semibold">
                    {group.name}

                    {locked && (
                      <Badge variant="neutral" className="ml-2">
                        {t("archived")}
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell>
                    {t("selectionRule", {
                      min: group.minimumSelections,
                      max: group.maximumSelections,
                    })}
                  </TableCell>

                  <TableCell>{group.sortOrder}</TableCell>

                  <TableCell>
                    {!locked && (
                      <div className="flex flex-wrap gap-2">
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

                        <ArchiveCatalogButton
                          compact
                          tenantId={catalog.tenantId}
                          id={group.id}
                          entityType="option-groups"
                          name={group.name}
                          onPendingChange={onPendingChange}
                        />
                      </div>
                    )}
                  </TableCell>
                </TableRow>

                {options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="pl-6">
                      {option.name}

                      {(locked || option.isArchived) && (
                        <Badge variant="neutral" className="ml-2">
                          {t("archived")}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap tabular-nums">
                      +{money.format(option.priceAdjustment)}
                    </TableCell>

                    <TableCell>{option.sortOrder}</TableCell>

                    <TableCell>
                      {!locked && !option.isArchived && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {options.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("noOptions")}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noOptionGroups")}</p>
      )}
    </section>
  )
}
