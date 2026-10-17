"use client"
import { createContext, useContext, type ReactNode } from "react"
import type { AnalyticsPageViewModel } from "@/types/analytics"
export type { AnalyticsPageViewModel, AnalyticsRange } from "@/types/analytics"

const Context = createContext<AnalyticsPageViewModel | null>(null)

export function useAnalyticsPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function AnalyticsPageProvider({
  model,
  children,
}: {
  model: AnalyticsPageViewModel
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
