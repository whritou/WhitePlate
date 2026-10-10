"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useDashboardPageModel } from "./dashboard-DashboardPage-model"

const Context = createContext<ReturnType<typeof useDashboardPageModel> | null>(
  null
)

export function useDashboardPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function DashboardPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useDashboardPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
