"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useStaffPageModel } from "./staff-StaffPage-model"

const Context = createContext<ReturnType<typeof useStaffPageModel> | null>(null)

export function useStaffPageView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function StaffPageProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useStaffPageModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
