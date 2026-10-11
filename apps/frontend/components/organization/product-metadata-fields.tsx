"use client"

import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
}: {
  prefix: string
  product?: CatalogProduct
}) {
  const t = useTranslations("Catalog")

  return (
    <div className="grid gap-4 sm:col-span-2">
      <h3 className="font-display text-lg font-semibold">
        {t("productMetadata")}
      </h3>

      <Label htmlFor={`${prefix}-sku`} className="grid gap-2 sm:max-w-sm">
        {t("sku")}

        <Input
          id={`${prefix}-sku`}
          name="sku"
          defaultValue={product?.sku ?? ""}
          maxLength={64}
        />

        <span className="text-sm text-muted-foreground">{t("skuHelp")}</span>
      </Label>

      <div className="grid gap-4 lg:grid-cols-2">
        {(["containsAllergens", "mayContainAllergens"] as const).map((kind) => (
          <fieldset key={kind} className="grid gap-2">
            <legend className="font-medium">{t(kind)}</legend>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {allergens.map((code) => {
                const label = t(`allergenNames.${code}`)
                const id = `${prefix}-${kind}-${code}`

                return (
                  <Label
                    key={code}
                    htmlFor={id}
                    className="flex min-h-11 items-center gap-2 text-sm md:min-h-12"
                  >
                    <Checkbox
                      id={id}
                      name={kind}
                      value={code}
                      defaultChecked={product?.[kind]?.includes(code)}
                      aria-label={label}
                    />

                    {label}
                  </Label>
                )
              })}
            </div>
          </fieldset>
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
        <Label htmlFor={`${prefix}-preparation-minutes`} className="grid gap-2">
          {t("preparationMinutes")}

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
        </Label>

        {(["en", "fr"] as const).map((locale) => (
          <Label
            key={locale}
            htmlFor={`${prefix}-preparation-${locale}`}
            className="grid gap-2"
          >
            {t("preparationNote", { locale: locale.toUpperCase() })}

            <Input
              id={`${prefix}-preparation-${locale}`}
              name={`preparationNote-${locale}`}
              maxLength={250}
              defaultValue={product?.preparationNotes?.[locale] ?? ""}
            />
          </Label>
        ))}
      </div>
    </div>
  )
}
