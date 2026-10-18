"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useWorkspaceToast } from "@/components/ui/toast"
import type { ActionState } from "@/types/organization"
import type {
  CatalogFormAction,
  CatalogSubmit,
  CatalogResult,
} from "@/types/catalog-management"

export function useCatalogForm(
  action: CatalogFormAction,
  resetOnSuccess = false,
  onSuccess?: (result: Extract<CatalogResult, { ok: true }>) => void,
  successMessage?: string,
  onPendingChange?: (pending: boolean) => void
) {
  const router = useRouter()
  const t = useTranslations("Catalog")
  const toast = useWorkspaceToast()
  const submitting = useRef(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState>({ status: "idle" })
  const submit: CatalogSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (submitting.current) return

    const element = event.currentTarget
    const input = new FormData(element)

    submitting.current = true
    onPendingChange?.(true)
    setState({ status: "pending" })
    startTransition(async () => {
      try {
        const result = await action(input)

        if (!result.ok) {
          setState({ status: "error", error: result.error })

          return
        }

        if (resetOnSuccess) element.reset()

        setState({ status: "success" })
        toast.success(successMessage ?? t("saved"))
        onSuccess?.(result)
        router.refresh()
      } catch {
        setState({ status: "error", error: "unavailable" })
      } finally {
        submitting.current = false
        onPendingChange?.(false)
      }
    })
  }

  return { pending, state, submit }
}
