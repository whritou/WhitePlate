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
import { useTranslations } from "next-intl"
import { ProductOrdering } from "./product-ordering"

export function MenuProductCard({
  product,
  item,
  locked,
  orderRound,
  price,
  onSave,
}: {
  product: Product
  imageIndex?: number
  item?: CartItem
  locked: boolean
  orderRound: number
  price: Intl.NumberFormat
  onSave: (item: CartItem) => void
}) {
  const t = useTranslations("Storefront")

  return (
    <Card
      size="sm"
      className="grid h-full grid-cols-1 grid-rows-[auto_auto_1fr_auto] gap-0 overflow-hidden p-0 shadow-none"
    >
      <ProductPhotoImage
        key={product.photos?.[0]?.id ?? "fallback"}
        productId={product.id}
        photo={product.photos?.[0]}
        size={640}
        className="col-start-1 row-start-1 aspect-[4/3] w-full"
      />

      <CardHeader className="col-start-1 row-start-2 min-w-0 px-4 pt-4 pb-0">
        <CardTitle>
          <h3 className="font-heading text-base font-bold break-words">
            {product.name}
          </h3>
        </CardTitle>
      </CardHeader>

      <CardContent className="col-start-1 row-start-3 flex min-w-0 flex-col gap-3 px-4 pt-2 pb-0">
        {product.description && (
          <p className="text-body-sm break-words text-muted-foreground">
            {product.description}
          </p>
        )}

        {!product.isAvailable && (
          <Badge variant="neutral" className="mt-auto">
            {t("unavailableProduct")}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="col-start-1 row-start-4 flex-wrap justify-between gap-3 border-t-0 p-4">
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
