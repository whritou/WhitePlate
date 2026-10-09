"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { useStorefrontView } from "./Storefront-Storefront-context"
import { StorefrontSection8 } from "./Storefront-Storefront-section-8"
import { SourceModal } from "@/components/ui/lovable-modal"
export function StorefrontSection7() {
  const { t, setCartOpen, u, line } = useStorefrontView()

  return (
    <SourceModal
      label={u("your")}
      onClose={() => setCartOpen(false)}
      onClick={(e) => e.stopPropagation()}
      className="sticky top-0 flex h-full max-h-screen w-full max-w-sm flex-col"
      style={{ background: t.bg }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${line}` }}
      >
        <h3 className="text-lg font-bold">
          <Copy>{u("your")}</Copy>
        </h3>

        <SourceButton
          onClick={() => setCartOpen(false)}
          aria-label="Close"
          className="text-xl"
        >
          ✕
        </SourceButton>
      </div>

      <StorefrontSection8 />
    </SourceModal>
  )
}
