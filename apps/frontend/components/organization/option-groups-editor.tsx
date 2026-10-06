"use client"

import { useLocale, useTranslations } from "next-intl"
import { ArchiveCatalogButton } from "@/components/organization/archive-catalog-button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  CatalogOption,
  CatalogOptionGroup,
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
}: OptionGroupsEditorProps) {
  const t = useTranslations("Catalog")
  const titleId = `option-groups-${productId}`
  const orderedGroups = [...optionGroups]
    .filter((group) => group.productId === productId)
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name)
    )

  return (
    <section
      aria-labelledby={titleId}
      className="grid gap-4 border-t border-border pt-5"
    >
      <header>
        <h4 id={titleId} className="font-medium text-foreground">
          {t("optionGroupsTitle")}
        </h4>

        <p className="mt-1 text-xs text-muted-foreground">
          {t("optionGroupsDescription")}
        </p>
      </header>

      {!parentArchived && (
        <OptionGroupForm
          tenantId={tenantId}
          productId={productId}
          productName={productName}
        />
      )}

      {orderedGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noOptionGroups")}</p>
      ) : (
        <ul className="grid gap-3">
          {orderedGroups.map((group) => (
            <li key={group.id}>
              <OptionGroupCard
                tenantId={tenantId}
                currency={currency}
                productName={productName}
                group={group}
                options={options}
                parentArchived={parentArchived}
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
}: {
  tenantId: string
  currency: string
  productName: string
  group: CatalogOptionGroup
  options: CatalogOption[]
  parentArchived: boolean
}) {
  const t = useTranslations("Catalog")
  const archived = parentArchived || group.isArchived
  const orderedOptions = [...options]
    .filter((option) => option.groupId === group.id)
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name)
    )

  return (
    <Card size="sm" className="gap-3">
      <CardHeader>
        <CardTitle>
          <h5 className="font-medium">{group.name}</h5>
        </CardTitle>

        <CardDescription>
          {t("selectionRule", {
            min: group.minimumSelections,
            max: group.maximumSelections,
          })}
        </CardDescription>

        {archived && <Badge variant="secondary">{t("archived")}</Badge>}
      </CardHeader>

      <CardContent className="grid gap-4">
        {archived ? (
          <p className="text-xs text-muted-foreground">
            {t("archivedOptionsHistory")}
          </p>
        ) : (
          <>
            <OptionGroupForm
              tenantId={tenantId}
              productId={group.productId}
              productName={productName}
              group={group}
              key={`${group.id}:${group.name}:${group.minimumSelections}:${group.maximumSelections}:${group.sortOrder}`}
            />

            <ArchiveCatalogButton
              tenantId={tenantId}
              id={group.id}
              entityType="option-groups"
              name={group.name}
            />

            <OptionForm tenantId={tenantId} currency={currency} group={group} />
          </>
        )}

        {orderedOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noOptions")}</p>
        ) : (
          <ul
            aria-label={t("optionsForGroup", { name: group.name })}
            className="grid gap-2"
          >
            {orderedOptions.map((option) => (
              <li key={option.id}>
                <OptionEntry
                  tenantId={tenantId}
                  currency={currency}
                  group={group}
                  option={option}
                  parentArchived={archived}
                />
              </li>
            ))}
          </ul>
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
}: {
  tenantId: string
  currency: string
  group: CatalogOptionGroup
  option: CatalogOption
  parentArchived: boolean
}) {
  const t = useTranslations("Catalog")
  const locale = useLocale()
  const archived = parentArchived || option.isArchived
  const formattedAdjustment = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(option.priceAdjustment)

  return (
    <Card size="sm" className="gap-3">
      <CardHeader>
        <CardTitle>
          <h6 className="font-medium">{option.name}</h6>
        </CardTitle>

        <CardDescription className="tabular-nums">
          +{formattedAdjustment}
        </CardDescription>

        {archived && <Badge variant="secondary">{t("archived")}</Badge>}
      </CardHeader>

      {!archived && (
        <CardContent className="grid gap-3">
          <OptionForm
            tenantId={tenantId}
            currency={currency}
            group={group}
            option={option}
            key={`${option.id}:${option.name}:${option.priceAdjustment}:${option.sortOrder}`}
          />

          <ArchiveCatalogButton
            tenantId={tenantId}
            id={option.id}
            entityType="options"
            name={option.name}
          />
        </CardContent>
      )}
    </Card>
  )
}
