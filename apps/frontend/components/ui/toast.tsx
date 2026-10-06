"use client"

import { Toast } from "@base-ui/react/toast"
import { createContext, useCallback, useContext, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { WorkspaceToastPublisher } from "@/types/workspace-toast"

const WorkspaceToastContext = createContext<WorkspaceToastPublisher | null>(
  null
)

export function WorkspaceToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider timeout={6000} limit={3}>
      <WorkspaceToastBridge>{children}</WorkspaceToastBridge>
    </Toast.Provider>
  )
}

function WorkspaceToastBridge({ children }: { children: ReactNode }) {
  const toastManager = Toast.useToastManager()
  const success = useCallback(
    (title: string) => {
      toastManager.add({ title, type: "success", priority: "low" })
    },
    [toastManager]
  )
  const value = { success }

  return (
    <WorkspaceToastContext.Provider value={value}>
      {children}
      <WorkspaceToastViewport />
    </WorkspaceToastContext.Provider>
  )
}

export function WorkspaceToastViewport() {
  const t = useTranslations("WorkspaceToast")
  const { toasts } = Toast.useToastManager()

  return (
    <Toast.Viewport
      aria-labelledby="workspace-toast-label"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex max-h-screen flex-col items-end gap-3 p-4 sm:inset-x-auto sm:right-0 sm:w-full sm:max-w-sm"
    >
      <span className="sr-only" id="workspace-toast-label">
        {t("notifications")}
      </span>

      <WorkspaceToastList toasts={toasts} />
    </Toast.Viewport>
  )
}

export function WorkspaceToastList({
  toasts,
}: {
  toasts: Toast.Root.ToastObject[]
}) {
  const t = useTranslations("WorkspaceToast")

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="pointer-events-auto w-full rounded-xl border border-border bg-card text-card-foreground shadow-lg transition outline-none data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0"
    >
      <Toast.Content className="flex items-center gap-3 p-4">
        <Toast.Title className="min-w-0 flex-1 text-sm font-medium" />

        <Toast.Close
          aria-label={t("dismiss")}
          render={<Button type="button" variant="ghost" size="sm" />}
        >
          {t("dismiss")}
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ))
}

export function useWorkspaceToast() {
  const publisher = useContext(WorkspaceToastContext)

  if (!publisher)
    throw new Error(
      "useWorkspaceToast must be used inside WorkspaceToastProvider"
    )

  return publisher
}
