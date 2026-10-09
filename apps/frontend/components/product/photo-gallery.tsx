"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { ProductPhoto } from "@/types/product-photos"
import { ProductPhotoImage } from "./photo-image"

export function ProductPhotoGallery({
  productId,
  photos = [],
}: {
  productId: string
  photos?: ProductPhoto[]
}) {
  const t = useTranslations("ProductPhotos")
  const [selected, setSelected] = useState(0)
  const photo = photos[selected] ?? photos[0]

  return (
    <section aria-label={t("gallery")} className="grid min-w-0 gap-3">
      <ProductPhotoImage
        key={photo?.id ?? "fallback"}
        productId={productId}
        photo={photo}
        size={1200}
        square
        className="aspect-square w-full"
      />

      {photos.length > 1 && (
        <div className="flex min-w-0 flex-wrap gap-2">
          {photos.map((item, index) => (
            <Button
              key={item.id}
              variant="outline"
              className="size-14 p-1"
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-pressed={photo?.id === item.id}
              onClick={() => setSelected(index)}
            >
              <ProductPhotoImage
                productId={productId}
                photo={item}
                size={320}
                square
                className="size-11"
              />
            </Button>
          ))}
        </div>
      )}
    </section>
  )
}
