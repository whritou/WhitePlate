"use client"

import { ArrowUpRight, Copy, QrCode } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import type { StorefrontShortcutLabels } from "@/types/catalog-management"

export function StorefrontShortcuts({
  url,
  fallbackHref,
  labels,
}: {
  url: string | null
  fallbackHref: string
  labels: StorefrontShortcutLabels
}) {
  const [showQr, setShowQr] = useState(false)
  const [copyStatus, setCopyStatus] = useState("")
  const qrUrl = url ? withQrAttribution(url) : ""

  async function copyUrl() {
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus(labels.copiedShopUrl)
    } catch {
      setCopyStatus(labels.copyShopUrlFailed)
    }
  }

  if (!url)
    return (
      <div className="grid gap-2">
        <Button
          nativeButton={false}
          role="link"
          variant="outline"
          className="min-h-11 md:min-h-12"
          render={<Link href={fallbackHref} />}
        >
          {labels.visitShop}

          <ArrowUpRight aria-hidden="true" />
        </Button>

        <p className="text-sm text-muted-foreground">
          {labels.shopUnavailable}
        </p>
      </div>
    )

  return (
    <div className="grid justify-items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          nativeButton={false}
          role="link"
          variant="outline"
          className="min-h-11 md:min-h-12"
          render={<a href={url} target="_blank" rel="noopener noreferrer" />}
        >
          {labels.visitShop}

          <ArrowUpRight aria-hidden="true" />
        </Button>

        <Button
          type="button"
          variant="outline"
          className="min-h-11 md:min-h-12"
          onClick={() => void copyUrl()}
        >
          <Copy aria-hidden="true" />
          {labels.copyShopUrl}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="min-h-11 md:min-h-12"
          aria-expanded={showQr}
          aria-controls="storefront-qr-code"
          onClick={() => setShowQr((shown) => !shown)}
        >
          <QrCode aria-hidden="true" />

          {showQr ? labels.hideShopQr : labels.showShopQr}
        </Button>
      </div>

      {copyStatus && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {copyStatus}
        </p>
      )}

      {showQr && (
        <div
          id="storefront-qr-code"
          className="grid justify-items-center gap-2 border bg-card p-3"
        >
          <QRCodeSVG
            value={qrUrl}
            size={176}
            level="M"
            title={labels.shopQrLabel}
            className="h-auto max-w-full"
          />

          <p className="max-w-56 text-center text-xs break-all text-muted-foreground">
            {qrUrl}
          </p>
        </div>
      )}
    </div>
  )
}

function withQrAttribution(value: string): string {
  const url = new URL(value)

  url.searchParams.set("source", "qr")

  return url.toString()
}
