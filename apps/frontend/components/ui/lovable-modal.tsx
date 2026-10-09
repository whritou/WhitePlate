"use client"

import { Dialog } from "@base-ui/react/dialog"
import type { ComponentProps } from "react"
import { useRef } from "react"
import { useLovableText } from "@/components/lovable/copy"
import { cn } from "@/lib/utils"

export function SourceModal({
  label,
  onClose,
  children,
  className,
  ...props
}: ComponentProps<"div"> & { label: string; onClose: () => void }) {
  const container = useRef<HTMLDivElement>(null)
  const text = useLovableText()

  return (
    <div ref={container} className="contents">
      <Dialog.Root
        open
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <Dialog.Portal container={container} className="contents">
          <Dialog.Popup
            aria-label={text(label)}
            {...props}
            className={cn(
              "relative z-10 max-h-[calc(100dvh-2rem)] overflow-y-auto",
              className
            )}
          >
            {children}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
