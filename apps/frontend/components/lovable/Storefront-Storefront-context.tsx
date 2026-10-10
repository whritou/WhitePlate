"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useStorefrontModel } from "./Storefront-Storefront-model"

const Context = createContext<ReturnType<typeof useStorefrontModel> | null>(
  null
)

export function useStorefrontView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function StorefrontProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useStorefrontModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
