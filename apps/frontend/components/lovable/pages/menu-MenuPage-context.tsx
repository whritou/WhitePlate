"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useMenuPageModel } from "./menu-MenuPage-model"

const Context = createContext<ReturnType<typeof useMenuPageModel> | null>(null)

export function useMenuPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function MenuPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useMenuPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
