import { buildJsonRequestInit } from "./request-options"
import {
  createRequestDiagnostic,
  parseJsonResponse,
  requestFailure,
} from "./request-result"
import type {
  ApiResult,
  JsonRequestClient,
  JsonRequestClientOptions,
  JsonRequestOptions,
} from "@/types/api"

export function createJsonRequestClient({
  credentials = "omit",
  fetcher,
  onDiagnostic,
}: JsonRequestClientOptions = {}): JsonRequestClient {
  async function request<T = unknown>(
    target: string | URL,
    options: JsonRequestOptions = {}
  ): Promise<ApiResult<T>> {
    const diagnostic = createRequestDiagnostic(options.method ?? "GET", target)

    try {
      const init = buildJsonRequestInit(options, credentials)
      const response =
        options.onUploadProgress && typeof XMLHttpRequest !== "undefined"
          ? await uploadWithProgress(target, init, options.onUploadProgress)
          : await (fetcher ?? fetch)(target, init)

      return await parseJsonResponse<T>(
        response,
        diagnostic,
        onDiagnostic,
        options.responseType
      )
    } catch (error) {
      return requestFailure(503, diagnostic, onDiagnostic, error)
    }
  }

  return { request }
}

function uploadWithProgress(
  target: string | URL,
  init: RequestInit,
  progress: (percent: number) => void
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const abort = () => xhr.abort()

    xhr.open(init.method ?? "POST", String(target))
    xhr.withCredentials = init.credentials === "same-origin"
    new Headers(init.headers).forEach((value, key) =>
      xhr.setRequestHeader(key, value)
    )
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100))
    }

    xhr.onload = () => {
      init.signal?.removeEventListener("abort", abort)
      if (
        xhr.responseURL &&
        new URL(xhr.responseURL).origin !==
          new URL(String(target), location.href).origin
      ) {
        reject(new Error("Unexpected upload origin"))

        return
      }

      resolve(
        new Response(xhr.responseText || null, {
          status: xhr.status,
          headers: {
            "Content-Type":
              xhr.getResponseHeader("Content-Type") ?? "application/json",
          },
        })
      )
    }

    xhr.onerror = xhr.onabort = () => {
      init.signal?.removeEventListener("abort", abort)
      reject(new Error("Upload unavailable"))
    }

    init.signal?.addEventListener("abort", abort, { once: true })
    if (init.signal?.aborted) {
      reject(new Error("Upload aborted"))

      return
    }

    xhr.send(init.body as Blob)
  })
}
