"use client"
import { createContext, useContext } from "react"
import type { VisualScope } from "@/types/visual-scope"

const Context = createContext<VisualScope>({ className: "" })

export const VisualScopeProvider = Context.Provider
export function useVisualScope() {
  return useContext(Context)
}
