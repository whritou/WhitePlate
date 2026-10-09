"use client"
import { useMenuPageView } from "./menu-MenuPage-context"
import { MenuPageSection3 } from "./menu-MenuPage-section-3"
export function MenuPageSection2() {
  const { tab } = useMenuPageView()

  return <>{tab === "dishes" && <MenuPageSection3 />}</>
}
