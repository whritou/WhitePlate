"use client"

import { Check, CircleSlash } from "lucide-react"
import { useState } from "react"
import { setProductAvailabilityAction } from "@/actions/catalog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type {
  ProductAvailability,
  ProductAvailabilityControlLabels,
} from "@/types/catalog-management"

export function ProductAvailabilityControls({
  tenantId,
  products: initialProducts,
  labels,
}: {
  tenantId: string
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
          <li
            key={product.id}
            className="grid min-w-0 gap-3 border-y py-3 sm:border sm:px-4"
          >
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold">
                {product.name}
              </p>

              <Badge variant={product.isAvailable ? "success" : "warning"}>
                {product.isAvailable ? (
                  <Check aria-hidden="true" />
                ) : (
                  <CircleSlash aria-hidden="true" />
                )}

                {product.isAvailable ? labels.available : labels.unavailable}
              </Badge>
            </div>

            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-fit md:min-h-12"
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

            {feedback?.productId === product.id && (
              <p
                role={feedback.error ? "alert" : "status"}
                aria-live={feedback.error ? "assertive" : "polite"}
                className="text-sm text-muted-foreground"
              >
                {feedback.message}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
