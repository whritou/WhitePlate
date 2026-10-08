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
      className="grid h-full grid-cols-[minmax(0,1fr)_5rem] grid-rows-[auto_1fr_auto] gap-x-3 gap-y-3 border-0 p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_6rem]"
    >
      <Image
        src={`/design/photo-${[15, 16, 17, 18, 19, 20][imageIndex % 6]}.webp`}
        alt=""
        width={96}
        height={96}
        className="col-start-2 row-start-1 size-20 rounded-md object-cover sm:size-24"
      />

      <CardHeader className="col-start-1 row-start-1 min-w-0 p-0 pb-0">
        <CardTitle>
          <h3 className="font-heading text-title-md leading-6 break-words">
            {product.name}
          </h3>
        </CardTitle>
      </CardHeader>

      <CardContent className="col-start-1 row-start-2 flex min-w-0 flex-col gap-sm p-0 pt-0">
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

      <CardFooter className="col-span-2 row-start-3 flex-wrap justify-between gap-3 border-t-0 p-0 pt-1 pb-3">
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
