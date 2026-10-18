"use client"
import { useMenuPageView } from "../context"
import { MenuPageSection3 } from "./section-03"
export function MenuPageSection2() {
  const { tab } = useMenuPageView()

  return <>{tab === "dishes" && <MenuPageSection3 />}</>
}
