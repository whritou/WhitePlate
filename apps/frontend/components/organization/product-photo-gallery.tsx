"use client"

import { useState } from "react"
import { ImagePlus, X } from "lucide-react"
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
  onRemove,
  onReorder,
  onAdd,
}: ProductPhotoGalleryProps & {
  onRemove: (index: number) => void
  onReorder: (from: number, to: number) => void
  onAdd: () => void
}) {
  const t = useTranslations("ProductPhotos")
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <div className="grid min-w-0 content-start gap-3">
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("gallery")}>
        {pending && Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={`photo-skeleton-${index}`} className="aspect-square w-full" />
        ))}
        {!error && photos.map((photo, index) => (
          <div
            key={photo.id}
            draggable={!busy}
            onDragStart={(event) => {
              if (busy) return
              setDragIndex(index)
              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData("text/plain", photo.id)
            }}
            onDragOver={(event) => {
              if (dragIndex !== null) {
                event.preventDefault()
                event.dataTransfer.dropEffect = "move"
              }
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragIndex !== null && dragIndex !== index) onReorder(dragIndex, index)
              setDragIndex(null)
            }}
            onDragEnd={() => setDragIndex(null)}
            className={`group relative aspect-square overflow-hidden border bg-secondary ${current?.id === photo.id ? "ring-2 ring-primary ring-offset-2" : ""} ${dragIndex === index ? "opacity-40" : ""}`}
          >
            <button
              type="button"
              className="size-full cursor-grab p-0"
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-pressed={current?.id === photo.id}
              disabled={busy}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" && index > 0) onReorder(index, index - 1)
                if (event.key === "ArrowRight" && index < photos.length - 1) onReorder(index, index + 1)
              }}
            >
              <ProductPhotoImage
                productId={productId}
                photo={photo}
                tenantId={tenantId}
                size={320}
                square
                className="size-full object-cover"
              />
            </button>
            {index === 0 && (
              <span className="label-mono pointer-events-none absolute top-1 left-1 bg-accent px-1.5 py-0.5">
                {t("cover")}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={busy}
              aria-label={t("removePhoto", { number: index + 1 })}
              className="absolute top-1 right-1 size-8 bg-foreground text-background hover:bg-foreground hover:text-background"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(index)
                onRemove(index)
              }}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        ))}
        {!error && photos.length < 8 && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onAdd}
            className="flex aspect-square h-auto w-full flex-col gap-2 border border-dashed text-center text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ImagePlus aria-hidden="true" className="size-5" />
            <span className="label-mono">{t("add")}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
