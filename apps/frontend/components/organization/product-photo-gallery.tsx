import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductPhotoImage } from "@/components/product/photo-image"
import type { ProductPhotoGalleryProps } from "@/types/product-photos"

export function ProductPhotoGallery({
  productId,
  tenantId,
  photos,
  current,
  pending,
  error,
  busy,
  onSelect,
}: ProductPhotoGalleryProps) {
  const t = useTranslations("ProductPhotos")

  return (
    <div className="grid min-w-0 content-start gap-3">
      {pending ? (
        <Skeleton className="aspect-square w-full" />
      ) : (
        <ProductPhotoImage
          key={current?.id ?? "fallback"}
          productId={productId}
          photo={error ? undefined : current}
          tenantId={tenantId}
          size={640}
          className="w-full"
        />
      )}

      {!error && photos.length > 0 && (
        <div
          role="group"
          aria-label={t("gallery")}
          className="flex min-w-0 flex-wrap gap-2"
        >
          {photos.map((photo, index) => (
            <Button
              key={photo.id}
              variant="outline"
              className="size-14 p-1"
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-pressed={current?.id === photo.id}
              disabled={busy}
              onClick={() => onSelect(index)}
            >
              <ProductPhotoImage
                productId={productId}
                photo={photo}
                tenantId={tenantId}
                size={320}
                square
                className="size-11"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
