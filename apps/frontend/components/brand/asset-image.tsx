"use client"

import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { useState } from "react"

export function BrandAssetImage({
  src,
  className = "",
  label,
  cover = false,
  onError,
}: {
  src?: string
  className?: string
  label: string
  cover?: boolean
  onError?: () => void
}) {
  const [failed, setFailed] = useState(false)

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-secondary text-muted-foreground ${className}`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={label}
          fill
          unoptimized
          className={cover ? "object-cover" : "object-contain"}
          onError={() => {
            setFailed(true)
            onError?.()
          }}
        />
      ) : (
        <span
          role="img"
          aria-label={label}
          className="flex items-center justify-center p-1"
        >
          <ImageIcon className="size-6" aria-hidden="true" />

          <span className="sr-only">{label}</span>
        </span>
      )}
    </div>
  )
}
