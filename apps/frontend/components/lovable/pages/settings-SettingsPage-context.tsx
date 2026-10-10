"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useSettingsPageModel } from "./settings-SettingsPage-model"

const Context = createContext<ReturnType<typeof useSettingsPageModel> | null>(
  null
)

export function useSettingsPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function SettingsPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useSettingsPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
