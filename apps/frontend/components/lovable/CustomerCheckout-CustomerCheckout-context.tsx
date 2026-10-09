"use client"
import { createContext, useContext, type ReactNode } from "react"
import { useCustomerCheckoutModel } from "./CustomerCheckout-CustomerCheckout-model"

const Context = createContext<ReturnType<
  typeof useCustomerCheckoutModel
> | null>(null)

export function useCustomerCheckoutView() {
  const model = useContext(Context)

  if (!model) throw new Error("Missing isolated demo model")

  return model
}

export function CustomerCheckoutProvider({
  model,
  children,
}: {
  model: ReturnType<typeof useCustomerCheckoutModel>
  children: ReactNode
}) {
  return <Context.Provider value={model}>{children}</Context.Provider>
}
