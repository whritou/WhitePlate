"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { decideCatalogTranslationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { CatalogTranslationReview } from "@/types/catalog-translation-workflow"

export function CatalogTranslationReviewActions({
  tenantId,
  review,
  onPendingChange,
}: {
  tenantId: string
  review: CatalogTranslationReview
  onPendingChange?: (pending: boolean) => void
}) {
  const t = useTranslations("MenuTranslations")
  const toast = useWorkspaceToast()
  const router = useRouter()
  const locked = useRef(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)

  async function decide(decision: "approve" | "reject") {
    if (locked.current) return
    locked.current = true
    setPending(true)
    setError(false)
    onPendingChange?.(true)

    try {
      const result = await decideCatalogTranslationAction({
        tenantId,
        reviewId: review.id,
        expectedVersion: review.version,
        decision,
      })

      if (result.ok) {
        toast.success(t("reviewSaved"))
        router.refresh()
      } else setError(true)
    } catch {
      setError(true)
    } finally {
      locked.current = false
      setPending(false)
      onPendingChange?.(false)
    }
  }

  if (!review.canReview)
    return (
      <p className="max-w-56 text-sm text-muted-foreground">
        {t("awaitingIndependentReviewer")}
      </p>
    )

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={pending}
          onClick={() => void decide("approve")}
        >
          {t("approve")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => void decide("reject")}
        >
          {t("reject")}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t("reviewError")}
        </p>
      )}
    </div>
  )
}
