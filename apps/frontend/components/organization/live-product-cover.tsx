"use client"
import { useQuery } from "@tanstack/react-query"
import { useLocale } from "next-intl"
import { fetchProductPhotos } from "@/lib/api/product-photo-browser"
import { ProductPhotoImage } from "@/components/product/photo-image"
export function LiveProductCover({
  userId,
  tenantId,
  productId,
  className = "size-14 shrink-0 border",
}: {
  className?: string
  userId?: string
  tenantId: string
  productId: string
}) {
  const locale = useLocale()
  const query = useQuery({
    queryKey: ["product-photos", userId, tenantId, locale, productId],
    queryFn: ({ signal }) => fetchProductPhotos(tenantId, productId, signal),
    enabled: Boolean(userId),
    retry: false,
    staleTime: 15_000,
  })

  return (
    <ProductPhotoImage
      key={query.data?.assets[0]?.id ?? "fallback"}
      productId={productId}
      tenantId={tenantId}
      photo={query.data?.assets[0]}
      size={320}
      square
      className={className}
    />
  )
}
