"use client"

import { createContext, useContext, useState } from "react"
import { useTranslations } from "next-intl"
import { createDemoReceipt } from "@/lib/checkout/demo-order"
import type { DemoCartItem, DemoContextValue, DemoReceipt } from "@/types/demo"

const DemoContext = createContext<DemoContextValue | null>(null)

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Redesign")
  const products = [
    {
      id: "burger",
      basePrice: 14.5,
      image: "/design/photo-15.webp",
      category: "burgers",
      name: t("burger"),
      description: t("burgerDescription"),
      badge: t("bestseller"),
    },
    {
      id: "bacon",
      basePrice: 13.75,
      image: "/design/photo-16.webp",
      category: "burgers",
      name: t("bacon"),
      description: t("baconDescription"),
      badge: t("chefChoice"),
    },
    {
      id: "chicken",
      basePrice: 12.9,
      image: "/design/photo-17.webp",
      category: "chicken",
      name: t("chicken"),
      description: t("chickenDescription"),
      badge: t("spicy"),
    },
    {
      id: "fries",
      basePrice: 5.8,
      image: "/design/photo-18.webp",
      category: "sides",
      name: t("fries"),
      description: t("friesDescription"),
      badge: t("sides"),
    },
    {
      id: "shake",
      basePrice: 6.5,
      image: "/design/photo-19.webp",
      category: "drinks",
      name: t("shake"),
      description: t("shakeDescription"),
      badge: t("houseMade"),
    },
    {
      id: "vegan",
      basePrice: 14,
      image: "/design/photo-20.webp",
      category: "drinks",
      name: t("vegan"),
      description: t("veganDescription"),
      badge: t("plantBased"),
    },
  ]
  const [cart, setCart] = useState<DemoCartItem[]>([
    { productId: "burger", quantity: 1 },
    { productId: "fries", quantity: 1 },
    { productId: "shake", quantity: 1 },
  ])
  const [discountCode, setDiscountCode] = useState("DIRECT10")
  const [customerName, setCustomerName] = useState("Marcus Vance")
  const [receipt, setReceipt] = useState<DemoReceipt | null>(null)
  const [status, setStatus] = useState<DemoContextValue["status"]>("Preparing")

  function changeQuantity(id: string, quantity: number) {
    if (
      !products.some((product) => product.id === id) ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 99
    )
      return

    setCart((items) => [
      ...items.filter((item) => item.productId !== id),
      ...(quantity ? [{ productId: id, quantity }] : []),
    ])
  }

  function placeOrder() {
    if (!cart.length || !customerName.trim()) return false

    setReceipt(createDemoReceipt(products, cart, discountCode, customerName))
    setStatus("Preparing")

    return true
  }

  function advanceOrder() {
    setStatus((current) =>
      current === "Pending"
        ? "Preparing"
        : current === "Preparing"
          ? "Ready"
          : "Completed"
    )
  }

  function resetOrder() {
    setReceipt(null)
    setStatus("Preparing")
  }

  return (
    <DemoContext.Provider
      value={{
        products,
        cart,
        discountCode,
        receipt,
        customerName,
        status,
        changeQuantity,
        setDiscountCode,
        setCustomerName,
        placeOrder,
        advanceOrder,
        resetOrder,
      }}
    >
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const value = useContext(DemoContext)

  if (!value) throw new Error("Demo state requires its isolated provider")

  return value
}
