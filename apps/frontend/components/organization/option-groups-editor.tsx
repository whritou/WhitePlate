"use client"

import { Plus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { ArchiveCatalogButton } from "@/components/organization/archive-catalog-button"
import { Badge } from "@/components/ui/badge"
import { EditorDialog } from "@/components/ui/editor-dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import type {
  CatalogOptionGroup,
  CatalogOption,
  OptionGroupsEditorProps,
} from "@/types/catalog-management"
import { OptionForm } from "./option-form"
import { OptionGroupForm } from "./option-group-form"

export function OptionGroupsEditor({
  tenantId,
  currency,
  productId,
  productName,
  optionGroups,
  options,
  parentArchived,
  studio,
}: OptionGroupsEditorProps) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const groups = optionGroups
    .filter((group) => group.productId === productId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

  return (
    <section className="grid gap-5" aria-label={t("optionGroupsTitle")}>
      <div
        className={
          studio
            ? "grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            : "flex flex-wrap items-center justify-between gap-3"
        }
      >
        <p
          className={
            studio
              ? "max-w-[32rem] text-sm text-muted-foreground"
              : "max-w-lg text-sm text-muted-foreground"
          }
        >
          {t("optionGroupsDescription")}
        </p>

        {!parentArchived && (
          <EditorDialog
            primary
            icon={Plus}
            title={t("newOptionGroupFor", { name: productName })}
            label={u("addGroup")}
            description={u("groupEditorHelp")}
          >
            {(callbacks) => (
              <OptionGroupForm
                tenantId={tenantId}
                productId={productId}
                productName={productName}
                {...callbacks}
              />
            )}
          </EditorDialog>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="py-6 text-muted-foreground">{t("noOptionGroups")}</p>
      ) : (
        <ul
          className={
            studio
              ? "grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-4"
              : "grid gap-5"
          }
        >
          {groups.map((group) => (
            <li key={group.id}>
              <OptionGroupCard
                tenantId={tenantId}
                currency={currency}
                productName={productName}
                group={group}
                options={options}
                parentArchived={parentArchived}
                studio={studio}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function OptionGroupCard({
  tenantId,
  currency,
  productName,
  group,
  options,
  parentArchived,
  studio,
}: {
  tenantId: string
  currency: string
  productName: string
  group: CatalogOptionGroup
  options: CatalogOption[]
  parentArchived: boolean
  studio?: boolean
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const archived = parentArchived || group.isArchived
  const entries = options
    .filter((option) => option.groupId === group.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

  return (
    <Card
      className={
        studio
          ? "h-full border-transparent bg-muted shadow-none dark:bg-secondary"
          : undefined
      }
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardTitle>
            <h3
              className={
                studio ? "text-base font-semibold break-words" : "break-words"
              }
            >
              {group.name}
            </h3>
          </CardTitle>

          <CardDescription>
            {t("selectionRule", {
              min: group.minimumSelections,
              max: group.maximumSelections,
            })}
          </CardDescription>

          {archived && <Badge variant="neutral">{t("archived")}</Badge>}
        </div>

        {!archived && (
          <div className="flex flex-wrap gap-2">
            <EditorDialog
              compact={studio}
              title={t("editOptionGroup", { name: group.name })}
              label={u("edit")}
              description={u("groupEditorHelp")}
            >
              {(callbacks) => (
                <OptionGroupForm
                  tenantId={tenantId}
                  productId={group.productId}
                  productName={productName}
                  group={group}
                  {...callbacks}
                />
              )}
            </EditorDialog>

            <ArchiveCatalogButton
              tenantId={tenantId}
              id={group.id}
              compact={studio}
              entityType="option-groups"
              name={group.name}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-4">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
        ) : (
          <ul
            aria-label={t("optionsForGroup", { name: group.name })}
            className={studio ? "grid gap-2" : "divide-y divide-border"}
          >
            {entries.map((option) => (
              <li key={option.id}>
                <OptionEntry
                  tenantId={tenantId}
                  currency={currency}
                  group={group}
                  option={option}
                  parentArchived={archived}
                  studio={studio}
                />
              </li>
            ))}
          </ul>
        )}

        {!archived && (
          <div>
            <EditorDialog
              primary={false}
              icon={Plus}
              title={t("newOptionFor", { name: group.name })}
              label={u("addOption")}
              description={u("optionEditorHelp")}
            >
              {(callbacks) => (
                <OptionForm
                  tenantId={tenantId}
                  currency={currency}
                  group={group}
                  {...callbacks}
                />
              )}
            </EditorDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OptionEntry({
  tenantId,
  currency,
  group,
  option,
  parentArchived,
  studio,
}: {
  tenantId: string
  currency: string
  group: CatalogOptionGroup
  option: CatalogOption
  parentArchived: boolean
  studio?: boolean
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("CatalogView")
  const locale = useLocale()
  const archived = parentArchived || option.isArchived

  return (
    <div
      className={
        studio
          ? "grid gap-2 rounded-md bg-card p-3"
          : "flex flex-wrap items-center justify-between gap-3 py-4"
      }
    >
      <div
        className={
          studio
            ? "flex min-w-0 items-start justify-between gap-2 text-sm"
            : "min-w-0"
        }
      >
        <p className="font-medium break-words">{option.name}</p>

        <p className="text-sm text-muted-foreground tabular-nums">
          +
          {new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
          }).format(option.priceAdjustment)}
        </p>

        {archived && <Badge variant="neutral">{t("archived")}</Badge>}
      </div>

      {!archived && (
        <div
          className={studio ? "flex justify-end gap-1" : "flex flex-wrap gap-2"}
        >
          <EditorDialog
            compact={studio}
            title={t("editOption", { name: option.name })}
            label={u("edit")}
            description={u("optionEditorHelp")}
          >
            {(callbacks) => (
              <OptionForm
                tenantId={tenantId}
                currency={currency}
                group={group}
                option={option}
                {...callbacks}
              />
            )}
          </EditorDialog>

          <ArchiveCatalogButton
            tenantId={tenantId}
            id={option.id}
            compact={studio}
            entityType="options"
            name={option.name}
          />
        </div>
      )}
    </div>
  )
}
