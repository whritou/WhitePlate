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
  item?: CartItem
  locked: boolean
  orderRound: number
  price: Intl.NumberFormat
  onSave: (item: CartItem) => void
}) {
  const t = useTranslations("Storefront")

  return (
    <Card size="sm" className="h-full gap-sm p-0 shadow-sm">
      <CardHeader className="p-md pb-0">
        <CardTitle>
          <h3 className="font-heading text-title-md leading-6">
            {product.name}
          </h3>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-sm p-md pt-0">
        {product.description && (
          <p className="text-body-sm text-muted-foreground">
            {product.description}
          </p>
        )}

        {!product.isAvailable && (
          <Badge variant="neutral" className="mt-auto">
            {t("unavailableProduct")}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-sm border-t-0 p-md pt-0">
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
