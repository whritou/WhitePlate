"use client"

import { QueryProvider } from "@/components/query-provider"
import { TenantSelectionProvider } from "@/components/tenant-selection-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { WorkspaceToastProvider } from "@/components/ui/toast"
import type { ReactNode } from "react"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <WorkspaceToastProvider>
      <QueryProvider>
        <TenantSelectionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </TenantSelectionProvider>
      </QueryProvider>
    </WorkspaceToastProvider>
  )
}
