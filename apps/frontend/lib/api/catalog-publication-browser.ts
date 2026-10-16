import { browserRequest } from "./browser-request"
import { isRecord } from "@/lib/validation/common"
import { parseCatalogHistory } from "@/lib/validation/catalog-management"
import type { ApiError } from "@/types/api"
import type { CatalogHistory } from "@/types/catalog-management"

export class CatalogHistoryRequestError extends Error {
  constructor(readonly code: ApiError) {
    super(code)
  }
}

export async function fetchCatalogHistory(
  tenantId: string,
  beforeVersion: number | null,
  signal: AbortSignal
): Promise<CatalogHistory> {
  const query = new URLSearchParams({ tenantId, pageSize: "25" })

  if (beforeVersion !== null) query.set("beforeVersion", String(beforeVersion))

  const response = await browserRequest(`/api/catalog-history?${query}`, {
    signal,
  })

  if (!response.ok) throw new CatalogHistoryRequestError(response.error)

  const body = response.data
  const history =
    isRecord(body) && body.ok === true ? parseCatalogHistory(body.data) : null

  if (!history) throw new CatalogHistoryRequestError("unavailable")

  return history
}
