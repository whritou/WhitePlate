"use client"
import { useMenuPageView } from "../context"
import { MenuPageSection15 } from "./section-15"
export function MenuPageSection14() {
  const { tab } = useMenuPageView()

  return <>{tab === "discounts" && <MenuPageSection15 />}</>
}
