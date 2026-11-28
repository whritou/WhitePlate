"use client"

import { RouteErrorContent } from "@/components/status/route-error-content"

export default function LocaleError({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const digest =
    error instanceof Error
      ? (error as Error & { digest?: string }).digest
      : undefined

  return <RouteErrorContent digest={digest} onRetry={retry} />
}
