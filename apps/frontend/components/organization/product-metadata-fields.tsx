"use client"

import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import type { CatalogProduct } from "@/types/catalog-management"

const allergens = [
  "celery",
  "cerealsWithGluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphites",
] as const
const diets = [
  "dairyFree",
  "glutenFree",
  "pescatarian",
  "vegan",
  "vegetarian",
] as const

export function ProductMetadataFields({
  prefix,
  product,
  disabled,
}: {
  prefix: string
  product?: CatalogProduct
  disabled?: boolean
}) {
  const t = useTranslations("Catalog")

  return (
    <div className="grid gap-4 sm:col-span-2">
      <h3 className="font-display text-lg font-semibold">
        {t("productMetadata")}
      </h3>

      <Label htmlFor={`${prefix}-sku`} className="grid min-w-0 gap-2">
        {t("sku")}

        <Input
          id={`${prefix}-sku`}
          name="sku"
          defaultValue={product?.sku ?? ""}
          maxLength={64}
          className="w-full min-w-0"
        />

        <span className="text-sm text-muted-foreground">{t("skuHelp")}</span>
      </Label>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["containsAllergens", "mayContainAllergens"] as const).map((kind) => (
          <div key={kind} className="grid min-w-0 content-start gap-2">
            <Label htmlFor={`${prefix}-${kind}`} className="font-medium">
              {t(kind)}
            </Label>

            <MultiSelect
              id={`${prefix}-${kind}`}
              name={kind}
              label={t(kind)}
              disabled={disabled}
              defaultValue={product?.[kind] ?? []}
              placeholder={t("allergenSelectPlaceholder")}
              selectedCountLabel={(count) =>
                t("allergenSelectedCount", { count })
              }
              clearLabel={t("clearAllergenSelection")}
              describedBy={`${prefix}-${kind}-help`}
              options={allergens.map((code) => ({
                value: code,
                label: t(`allergenNames.${code}`),
              }))}
            />

            <span
              id={`${prefix}-${kind}-help`}
              className="text-xs text-muted-foreground"
            >
              {t("multiSelectHelp")}
            </span>
          </div>
        ))}
      </div>

      <fieldset className="grid gap-2">
        <legend className="font-medium">{t("dietaryDeclarations")}</legend>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {diets.map((code) => {
            const label = t(`dietaryNames.${code}`)
            const id = `${prefix}-diet-${code}`

            return (
              <Label
                key={code}
                htmlFor={id}
                className="flex min-h-11 items-center gap-2 text-sm md:min-h-12"
              >
                <Checkbox
                  id={id}
                  name="dietaryTags"
                  value={code}
                  defaultChecked={product?.dietaryTags?.includes(code)}
                  aria-label={label}
                />

                {label}
              </Label>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-preparation-minutes`}
            className="flex min-h-12 items-end pb-1"
          >
            {t("preparationMinutes")}
          </Label>

          <Input
            id={`${prefix}-preparation-minutes`}
            name="preparationMinutes"
            type="number"
            min={1}
            max={1440}
            step={1}
            defaultValue={product?.preparationMinutes ?? ""}
          />

          <span className="text-sm text-muted-foreground">
            {t("preparationHelp")}
          </span>
        </div>

        {(["en", "fr"] as const).map((locale) => (
          <div key={locale} className="grid min-w-0 content-start gap-2">
            <Label
              htmlFor={`${prefix}-preparation-${locale}`}
              className="flex min-h-12 items-end pb-1"
            >
              {t("preparationNote", { locale: locale.toUpperCase() })}
            </Label>

            <Input
              id={`${prefix}-preparation-${locale}`}
              name={`preparationNote-${locale}`}
              maxLength={250}
              defaultValue={product?.preparationNotes?.[locale] ?? ""}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
