import type { JsonRequestOptions } from "@/types/api"

export function buildJsonRequestInit(
  options: JsonRequestOptions,
  credentials: "omit" | "same-origin"
): RequestInit {
  const {
    method = "GET",
    body,
    bearerToken,
    idempotencyKey,
    ifMatch,
    signal,
  } = options
  const headers = new Headers({ Accept: "application/json" })

  if (body !== undefined) headers.set("Content-Type", "application/json")
  if (bearerToken) headers.set("Authorization", `Bearer ${bearerToken}`)
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey)
  if (ifMatch) headers.set("If-Match", ifMatch)

  return {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    redirect: "error",
    credentials,
    signal,
  }
}
