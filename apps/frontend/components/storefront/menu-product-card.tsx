import Image from "next/image"
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
  imageIndex = 0,
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
      className="relative h-full gap-sm border-0 p-0 pr-28 shadow-sm"
    >
      <Image
        src={`/design/photo-${[15, 16, 17, 18, 19, 20][imageIndex % 6]}.webp`}
        alt=""
        width={96}
        height={96}
        className="absolute top-4 right-4 size-24 rounded-md object-cover"
      />

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

      <CardFooter className="-mr-28 justify-between gap-sm border-t-0 p-md pt-0">
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
