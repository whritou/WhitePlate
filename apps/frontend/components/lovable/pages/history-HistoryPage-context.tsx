"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useHistoryPageModel } from "./history-HistoryPage-model"

const Context = createContext<ReturnType<typeof useHistoryPageModel> | null>(
  null
)

export function useHistoryPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function HistoryPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useHistoryPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
