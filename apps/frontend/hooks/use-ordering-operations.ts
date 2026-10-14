"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { updateOrderingOperationsAction } from "@/actions/ordering-operations"
import {
  fetchOrderingOperations,
  OrderingOperationsRequestError,
} from "@/lib/api/ordering-operations-browser"
import { orderingOperationsQueryKeys } from "@/lib/query/ordering-operations-query"
import { useRouter } from "@/i18n/navigation"
import type { RestaurantRole } from "@/types/orders"
import type { OrderingOperations } from "@/types/ordering-operations"

export function useOrderingOperations({
  userId,
  tenantId,
  locale,
  role,
  initialOperations,
}: {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
  initialOperations: OrderingOperations | null
}) {
  const client = useQueryClient()
  const router = useRouter()
  const queryKey = orderingOperationsQueryKeys.tenant({
    userId,
    tenantId,
    locale,
    role,
  })
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchOrderingOperations(tenantId, signal),
    initialData: initialOperations ?? undefined,
    staleTime: 0,
    refetchInterval: 15_000,
    retry: false,
  })
  const mutation = useMutation({
    mutationFn: async (input: {
      acceptingOrders: boolean
      rushHoldEnabled: boolean
    }) => {
      const current = client.getQueryData<OrderingOperations>(queryKey)

      if (!current) throw new OrderingOperationsRequestError("unavailable")

      const response = await updateOrderingOperationsAction({
        tenantId,
        version: current.version,
        ...input,
      })

      if (!response.ok)
        throw new OrderingOperationsRequestError(
          response.status === 401
            ? "unauthorized"
            : response.status === 403 || response.status === 404
              ? "forbidden"
              : response.status === 400 || response.status === 428
                ? "invalid"
                : response.status === 412 || response.status === 409
                  ? "conflict"
                  : "unavailable"
        )

      if (!response.data)
        throw new OrderingOperationsRequestError("unavailable")

      return response.data
    },
    onSuccess: (data) => {
      client.setQueryData(queryKey, data)
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey })
    },
  })
  const error =
    mutation.error instanceof OrderingOperationsRequestError
      ? mutation.error.code
      : query.error instanceof OrderingOperationsRequestError
        ? query.error.code
        : mutation.error || query.error
          ? "unavailable"
          : null

  useEffect(() => {
    if (error === "unauthorized") {
      client.clear()
      router.push("/sign-in")
    } else if (error === "forbidden") {
      client.removeQueries({
        queryKey: orderingOperationsQueryKeys.tenant({
          userId,
          tenantId,
          locale,
          role,
        }),
        type: "inactive",
      })
    }
  }, [client, error, locale, role, router, tenantId, userId])

  return {
    operations:
      error === "forbidden" || error === "unauthorized"
        ? null
        : (query.data ?? null),
    loadError: query.error ? error : null,
    updateError: mutation.error ? error : null,
    isInitialLoading: query.isPending && !query.data,
    isFetching: query.isFetching,
    isUpdating: mutation.isPending,
    retry: query.refetch,
    update: mutation.mutateAsync,
    updateSucceeded: mutation.isSuccess,
    clearUpdateFeedback: mutation.reset,
  }
}
