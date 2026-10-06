"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "@/i18n/navigation"
import type { ActionState } from "@/types/organization"
import type {
  CatalogFormAction,
  CatalogSubmit,
} from "@/types/catalog-management"

export function useCatalogForm(
  action: CatalogFormAction,
  resetOnSuccess = false,
  onSuccess?: () => void
) {
  const router = useRouter()
  const submitting = useRef(false)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<ActionState>({ status: "idle" })
  const submit: CatalogSubmit = (event) => {
    event.preventDefault()

    if (submitting.current) return

    const element = event.currentTarget
    const input = new FormData(element)

    submitting.current = true
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
        onSuccess?.()
        router.refresh()
      } catch {
        setState({ status: "error", error: "unavailable" })
      } finally {
        submitting.current = false
      }
    })
  }

  return { pending, state, submit }
}
