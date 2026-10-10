"use client"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection15 } from "./menu-MenuPage-section-15"
export function MenuPageSection14() {
  const { tab } = useMenuPageView()

  return <>{tab === "discounts" && <MenuPageSection15 />}</>
}
