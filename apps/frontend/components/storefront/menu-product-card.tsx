import { ProductPhotoImage } from "@/components/product/photo-image"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CartItem } from "@/types/checkout"
import type { Product } from "@/types/storefront"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import { useLocale, useTranslations } from "next-intl"
import { ProductOrdering } from "./product-ordering"

export function MenuProductCard({
  product,
  restaurantSlug,
  layout,
  item,
  locked,
  orderRound,
  price,
  onSave,
}: {
  product: Product
  restaurantSlug?: string
  layout: StoreTheme["layout"]
  imageIndex?: number
  item?: CartItem
  locked: boolean
  orderRound: number
  price: Intl.NumberFormat
  onSave: (item: CartItem) => void
}) {
  const t = useTranslations("Storefront")
  const locale = useLocale()

  return (
    <Card
      size="sm"
      className={`grid h-full gap-0 overflow-hidden p-0 shadow-none ${layout === "grid" ? "grid-cols-1 grid-rows-[auto_auto_1fr_auto]" : "customer-product-list grid-cols-[7rem_minmax(0,1fr)] grid-rows-[auto_1fr_auto]"}`}
    >
      <ProductPhotoImage
        key={product.photos?.[0]?.id ?? "fallback"}
        productId={product.id}
        photo={product.photos?.[0]}
        restaurantSlug={restaurantSlug}
        size={640}
        square
        className={`customer-product-image ${layout === "grid" ? "customer-image-ratio" : "row-span-3 h-full"} col-start-1 row-start-1 w-full`}
      />

      <CardHeader
        className={`${layout === "grid" ? "col-start-1 row-start-2" : "col-start-2 row-start-1"} min-w-0 px-4 pt-4 pb-0`}
      >
        <CardTitle>
          <h3 className="font-heading text-base font-bold wrap-anywhere">
            {product.name}
          </h3>
        </CardTitle>
      </CardHeader>

      <CardContent
        className={`${layout === "grid" ? "col-start-1 row-start-3" : "col-start-2 row-start-2"} flex min-w-0 flex-col gap-3 px-4 pt-2 pb-0`}
      >
        {product.description && (
          <p className="text-body-sm wrap-anywhere text-muted-foreground">
            {product.description}
          </p>
        )}

        {((product.containsAllergens?.length ?? 0) > 0 ||
          (product.mayContainAllergens?.length ?? 0) > 0) && (
          <div className="grid gap-1 text-sm">
            {(product.containsAllergens?.length ?? 0) > 0 && (
              <p>
                <span className="font-semibold">{t("containsAllergens")}:</span>{" "}
                {product.containsAllergens
                  ?.map((code) => t(`allergenNames.${code}`))
                  .join(", ")}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {t("allergenDisclaimer")}
            </p>

            {(product.mayContainAllergens?.length ?? 0) > 0 && (
              <p>
                <span className="font-semibold">
                  {t("mayContainAllergens")}:
                </span>{" "}
                {product.mayContainAllergens
                  ?.map((code) => t(`allergenNames.${code}`))
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        {(product.dietaryTags?.length ?? 0) > 0 && (
          <div
            className="flex flex-wrap gap-1"
            aria-label={t("dietaryDeclarations")}
          >
            {product.dietaryTags?.map((code) => (
              <Badge key={code} variant="neutral">
                {t(`dietaryNames.${code}`)}
              </Badge>
            ))}
          </div>
        )}

        {product.preparationMinutes != null && (
          <p className="text-sm text-muted-foreground">
            {t("preparationEstimate", { minutes: product.preparationMinutes })}
          </p>
        )}

        {(product.preparationNotes?.[locale] ??
          product.preparationNotes?.[locale.split("-")[0]]) && (
          <p className="text-sm text-muted-foreground">
            {product.preparationNotes?.[locale] ??
              product.preparationNotes?.[locale.split("-")[0]]}
          </p>
        )}

        {!product.isAvailable && (
          <Badge variant="neutral" className="mt-auto">
            {t("unavailableProduct")}
          </Badge>
        )}
      </CardContent>

      <CardFooter
        className={`${layout === "grid" ? "col-start-1 row-start-4" : "col-start-2 row-start-3"} flex-wrap justify-between gap-3 border-t-0 p-4`}
      >
        <span className="font-heading text-headline-sm tabular-nums">
          {price.format(product.basePrice)}
        </span>

        {product.isAvailable && (
          <ProductOrdering
            key={`${product.id}-${orderRound}`}
            product={product}
            item={item}
            locked={locked}
            price={price}
            onSave={onSave}
          />
        )}
      </CardFooter>
    </Card>
  )
}
