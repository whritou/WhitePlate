"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useStudioPageModel } from "./studio-StudioPage-model"

const Context = createContext<ReturnType<typeof useStudioPageModel> | null>(
  null
)

export function useStudioPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function StudioPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useStudioPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
