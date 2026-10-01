"use client"

import { QueryProvider } from "@/components/query-provider"
import { TenantSelectionProvider } from "@/components/tenant-selection-provider"
import { ThemeProvider } from "@/components/theme-provider"
import type { ReactNode } from "react"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <TenantSelectionProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </TenantSelectionProvider>
    </QueryProvider>
  )
}
