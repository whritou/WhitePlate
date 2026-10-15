"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useTranslations } from "next-intl"
import { setProductAvailabilityAction } from "@/actions/catalog"
import { useRouter } from "@/i18n/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CatalogProduct } from "@/types/catalog-management"

export function MenuBuilderProductAvailabilityButton({
  tenantId,
  product,
  disabled,
  onPendingChange,
  children,
}: {
  tenantId: string
  product: CatalogProduct
  disabled: boolean
  onPendingChange: (pending: boolean) => void
  children: ReactNode
}) {
  const t = useTranslations("Catalog")
  const l = useTranslations("LiveWorkspace")
  const m = useTranslations("MenuBuilder")
  const router = useRouter()
  const [available, setAvailable] = useState(product.isAvailable)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const VisibilityIcon = available ? Eye : EyeOff

  async function toggleAvailability() {
    if (saving || disabled) return

    const previous = available
    const next = !previous

    setAvailable(next)
    setSaving(true)
    setFailed(false)
    onPendingChange(true)

    try {
      const result = await setProductAvailabilityAction({
        tenantId,
        id: product.id,
        isAvailable: next,
      })

      if (!result.ok) {
        setAvailable(previous)
        setFailed(true)
      } else {
        router.refresh()
      }
    } catch {
      setAvailable(previous)
      setFailed(true)
    } finally {
      setSaving(false)
      onPendingChange(false)
    }
  }

  return (
    <>
      <Badge variant={available ? "success" : "warning"}>
        {saving
          ? l("updatingAvailability")
          : available
            ? t("available")
            : t("unavailable")}
      </Badge>

      <div
        className="live-dish-actions flex shrink-0 flex-col items-center"
        data-no-drag="true"
      >
        {children}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-foreground"
          disabled={disabled || saving}
          data-no-drag="true"
          data-visibility-action="true"
          aria-label={m(available ? "hideProductNamed" : "showProductNamed", {
            name: product.name,
          })}
          aria-pressed={available}
          aria-busy={saving}
          onClick={() => void toggleAvailability()}
        >
          <VisibilityIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>

      {failed && (
        <span className="sr-only" role="alert">
          {l("availabilityUpdateFailed")}
        </span>
      )}
    </>
  )
}
