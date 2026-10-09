"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useAnalyticsPageModel } from "./analytics-AnalyticsPage-model"

const Context = createContext<ReturnType<typeof useAnalyticsPageModel> | null>(
  null
)

export function useAnalyticsPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function AnalyticsPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useAnalyticsPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
