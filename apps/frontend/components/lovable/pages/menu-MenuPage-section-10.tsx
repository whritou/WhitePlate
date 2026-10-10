"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceButton } from "@/components/ui/lovable-controls"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection11 } from "./menu-MenuPage-section-11"
export function MenuPageSection10() {
  const { lang, setSelId } = useMenuPageView()

  return (
    <div>
      <div className="flex items-center justify-between border-b px-5 py-3">
        <p className="label-mono text-muted-foreground">
          <Copy>Edit dish · </Copy>

          <Copy>{lang.toUpperCase()}</Copy>
        </p>

        <SourceButton onClick={() => setSelId(null)} aria-label="Close editor">
          ✕
        </SourceButton>
      </div>

      <MenuPageSection11 />
    </div>
  )
}
