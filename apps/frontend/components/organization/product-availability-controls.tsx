"use client"

import { Check, CircleSlash } from "lucide-react"
import { useState } from "react"
import { setProductAvailabilityAction } from "@/actions/catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LiveProductCover } from "./live-product-cover"
import type {
  ProductAvailability,
  ProductAvailabilityControlLabels,
} from "@/types/catalog-management"

export function ProductAvailabilityControls({
  tenantId,
  userId,
  canManageAvailability,
  products: initialProducts,
  labels,
}: {
  tenantId: string
  userId?: string
  canManageAvailability: boolean
  products: ProductAvailability[]
  labels: ProductAvailabilityControlLabels
}) {
  const [products, setProducts] = useState(initialProducts)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{
    productId: string
    message: string
    error: boolean
  } | null>(null)

  async function toggleAvailability(productId: string) {
    if (pendingProductId) return

    const product = products.find((item) => item.id === productId)

    if (!product) return

    const nextAvailability = !product.isAvailable

    setPendingProductId(productId)
    setFeedback(null)
    setProducts((current) =>
      current.map((item) =>
        item.id === productId
          ? { ...item, isAvailable: nextAvailability }
          : item
      )
    )

    try {
      const result = await setProductAvailabilityAction({
        tenantId,
        id: productId,
        isAvailable: nextAvailability,
      })

      if (!result.ok) {
        setProducts((current) =>
          current.map((item) =>
            item.id === productId
              ? { ...item, isAvailable: product.isAvailable }
              : item
          )
        )
        setFeedback({ productId, message: labels.updateFailed, error: true })
      } else {
        setFeedback({ productId, message: labels.updated, error: false })
      }
    } catch {
      setProducts((current) =>
        current.map((item) =>
          item.id === productId
            ? { ...item, isAvailable: product.isAvailable }
            : item
        )
      )
      setFeedback({ productId, message: labels.updateFailed, error: true })
    } finally {
      setPendingProductId(null)
    }
  }

  return (
    <ul className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const isPending = pendingProductId === product.id
        const label = `${labels.availabilityFor}: ${product.name}`

        return (
          <li key={product.id} className="min-w-0">
            <Card className="h-full">
              <div className="grid gap-3 p-3 sm:p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <LiveProductCover
                    className="size-20 shrink-0 border sm:size-24"
                    userId={userId}
                    tenantId={tenantId}
                    productId={product.id}
                  />

                  <div className="grid min-w-0 gap-2">
                    <p
                      title={product.name}
                      className="min-w-0 text-sm font-semibold break-words"
                    >
                      {product.name}
                    </p>

                    <Badge
                      variant={product.isAvailable ? "success" : "warning"}
                    >
                      {product.isAvailable ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <CircleSlash aria-hidden="true" />
                      )}

                      {product.isAvailable
                        ? labels.available
                        : labels.unavailable}
                    </Badge>
                  </div>
                </div>

                {canManageAvailability && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 w-full md:min-h-12"
                    disabled={pendingProductId !== null}
                    aria-label={label}
                    aria-pressed={product.isAvailable}
                    aria-busy={isPending}
                    onClick={() => void toggleAvailability(product.id)}
                  >
                    {isPending
                      ? labels.updating
                      : product.isAvailable
                        ? labels.markUnavailable
                        : labels.markAvailable}
                  </Button>
                )}

                {feedback?.productId === product.id && (
                  <p
                    role={feedback.error ? "alert" : "status"}
                    aria-live={feedback.error ? "assertive" : "polite"}
                    className="text-sm text-muted-foreground"
                  >
                    {feedback.message}
                  </p>
                )}
              </div>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
