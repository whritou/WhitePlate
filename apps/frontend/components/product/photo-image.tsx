"use client"

import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { photoUrl } from "@/lib/product-photos"
import type { ProductPhoto } from "@/types/product-photos"

export function ProductPhotoImage({
  productId,
  photo,
  tenantId,
  size = 640,
  className = "",
  square = false,
}: {
  productId: string
  photo?: ProductPhoto
  tenantId?: string
  size?: number
  className?: string
  square?: boolean
}) {
  const t = useTranslations("ProductPhotos")
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const src = photo ? photoUrl(productId, photo.id, size, tenantId) : undefined

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground ${className}`}
      style={
        square
          ? undefined
          : { aspectRatio: photo ? `${photo.width}/${photo.height}` : "4/3" }
      }
    >
      {src && !failed ? (
        <Image
          key={attempt}
          src={src}
          alt=""
          fill
          unoptimized
          loading={tenantId && size === 640 ? "eager" : "lazy"}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          role="img"
          aria-label={t("fallback")}
          className="flex max-w-full flex-col items-center gap-2 p-2 text-center text-xs"
        >
          <ImageIcon aria-hidden="true" className="size-6" />

          <span className={square ? "sr-only" : undefined}>
            {t("fallback")}
          </span>
        </span>
      )}

      {failed && tenantId && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFailed(false)
            setAttempt((value) => value + 1)
          }}
          className="absolute bottom-2 min-h-11 max-w-full text-xs md:min-h-12"
        >
          {t("retryPreview")}
        </Button>
      )}
    </div>
  )
}
