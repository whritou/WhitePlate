"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchOrderPage, OrderRequestError } from "@/lib/api/order-browser"
import { orderQueryKeys } from "@/lib/query/order-query"
import { updateOrderStatusAction } from "@/actions/orders"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import type {
  OrderDashboardProps,
  UpdateOrderStatusInput,
} from "@/types/orders"

export function useOrderDashboard(props: OrderDashboardProps) {
  const { userId, tenantId, locale, selectedStatus, cursor, page, loadError } =
    props
  const scope = { userId, tenantId, locale }
  const client = useQueryClient()
  const router = useRouter()
  const t = useTranslations("KitchenOrders")
  const toast = useWorkspaceToast()
  const inFlight = useRef(false)
  const [message, setMessage] = useState<string | null>(null)
  const query = useQuery({
    queryKey: orderQueryKeys.page(scope, selectedStatus, cursor),
    queryFn: ({ signal }) =>
      fetchOrderPage(tenantId, selectedStatus, cursor, signal),
    initialData: page ?? undefined,
    enabled: (query) =>
      loadError !== "invalid" &&
      !(
        query.state.error instanceof OrderRequestError &&
        ["unauthorized", "forbidden"].includes(query.state.error.code)
      ),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false,
  })
  const refresh = useCallback(
    () =>
      client.invalidateQueries({
        queryKey: orderQueryKeys.tenant({ userId, tenantId, locale }),
      }),
    [client, userId, tenantId, locale]
  )
  const mutation = useMutation({
    mutationFn: async (input: UpdateOrderStatusInput) => {
      const result = await updateOrderStatusAction(input)

      if (!result.ok) throw new OrderRequestError(result.error)
    },
    retry: false,
    onSuccess: async () => {
      toast.success(t("statusSaved"))
      await refresh()
    },
    onError: async (error) => {
      const code =
        error instanceof OrderRequestError ? error.code : "unavailable"

      setMessage(`errors.${code}`)
      if (code === "conflict" || code === "forbidden") await refresh()
      if (code === "unauthorized") {
        client.clear()
        router.push("/sign-in")
      }
    },
  })
  const error =
    query.error instanceof OrderRequestError
      ? query.error.code
      : query.error
        ? "unavailable"
        : null

  useEffect(() => {
    if (error !== "unauthorized" && error !== "forbidden") return
    // Keep the failed active query disabled, while removing every inactive page.
    client.removeQueries({
      queryKey: orderQueryKeys.tenant({ userId, tenantId, locale }),
      type: "inactive",
    })
    if (error === "unauthorized") router.push("/sign-in")
  }, [client, error, router, userId, tenantId, locale])

  async function updateStatus(input: Omit<UpdateOrderStatusInput, "tenantId">) {
    if (
      inFlight.current ||
      loadError === "invalid" ||
      error === "forbidden" ||
      error === "unauthorized"
    )
      return
    inFlight.current = true
    setMessage(null)
    try {
      await mutation.mutateAsync({ ...input, tenantId })
    } catch {
      // onError maps the failure and refreshes conflicting snapshots.
    } finally {
      inFlight.current = false
    }
  }

  const unavailable =
    error === "unavailable" || (!query.data && loadError === "unavailable")
  const isInitialLoading =
    query.isPending && !query.data && loadError !== "invalid"
  const currentPage =
    loadError === "invalid" || (error && error !== "unavailable")
      ? null
      : (query.data ?? null)

  return {
    page: currentPage,
    loadError: isInitialLoading
      ? null
      : (error ??
        (loadError === "invalid"
          ? "invalid"
          : unavailable
            ? "unavailable"
            : null)),
    isStale: unavailable && currentPage !== null,
    isInitialLoading,
    isFetching: query.isFetching,
    pending: mutation.isPending ? mutation.variables : null,
    message,
    refresh,
    retry: query.refetch,
    updateStatus,
  }
}
