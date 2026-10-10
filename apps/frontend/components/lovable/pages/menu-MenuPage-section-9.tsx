"use client"
import { Copy } from "@/components/lovable/copy"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection10 } from "./menu-MenuPage-section-10"
export function MenuPageSection9() {
  const { item } = useMenuPageView()

  return (
    <>
      {item ? (
        <MenuPageSection10 />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-display text-xl font-bold">
            <Copy>Select a dish</Copy>
          </p>

          <p className="text-sm text-muted-foreground">
            <Copy>Edit photos, translations, allergens and options here.</Copy>
          </p>
        </div>
      )}
    </>
  )
}
