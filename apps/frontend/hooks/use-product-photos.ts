"use client"

import { useEffect, useRef, useState } from "react"
import { useLocale } from "next-intl"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchProductPhotos,
  saveProductGallery,
  uploadProductFile,
} from "@/lib/api/product-photo-browser"
import { BrandRequestError } from "@/lib/api/brand-browser"
import { validatePhotoFile } from "@/lib/product-photos"
import type {
  ProductPhoto,
  ProductPhotosProps,
  PhotoError,
  PhotoUploadAttempt,
} from "@/types/product-photos"

export function useProductPhotos({
  userId,
  tenantId,
  productId,
  archived,
  onPendingChange,
}: ProductPhotosProps) {
  const locale = useLocale()
  const client = useQueryClient()
  const queryKey = ["product-photos", userId, tenantId, locale, productId]
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchProductPhotos(tenantId, productId, signal),
    retry: false,
    staleTime: 15_000,
  })
  const [draft, setDraft] = useState<ProductPhoto[] | null>(null)
  const [busy, setBusy] = useState<"upload" | "save" | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<PhotoError | null>(null)
  const [saved, setSaved] = useState(false)
  const gate = useRef(false)
  const expected = useRef<string[] | null>(null)
  const controller = useRef<AbortController | null>(null)
  const [retryFile, setRetryFile] = useState<PhotoUploadAttempt | null>(null)
  const photos = draft ?? query.data?.assets ?? []
  const available =
    Boolean(query.data?.storageAvailable) && !query.isError && !archived

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    if (draft) window.addEventListener("beforeunload", warn)

    return () => window.removeEventListener("beforeunload", warn)
  }, [draft])

  function failure(reason: unknown) {
    setError(
      !navigator.onLine
        ? "offline"
        : reason instanceof BrandRequestError
          ? reason.code
          : "unavailable"
    )
  }

  function change(next: ProductPhoto[]) {
    expected.current ??= query.data?.assets.map((photo) => photo.id) ?? []
    setDraft(next)
    setSaved(false)
  }

  function discard() {
    setDraft(null)
    expected.current = null
    setRetryFile(null)
    setError(null)
    setSaved(false)
    void query.refetch()
  }

  async function upload(file: File, aspect: string, target?: string) {
    if (gate.current || !available) return
    setRetryFile({ file, aspect, target })
    setError(null)
    setSaved(false)
    if (!validatePhotoFile(file) || (!target && photos.length >= 8)) {
      setError("invalid")

      return
    }

    if (!navigator.onLine) {
      setError("offline")

      return
    }

    gate.current = true
    setBusy("upload")
    onPendingChange?.(true)
    setProgress(0)
    controller.current = new AbortController()
    try {
      const photo = await uploadProductFile(
        tenantId,
        productId,
        aspect,
        file,
        setProgress,
        controller.current.signal
      )

      change(
        target
          ? photos.map((item) => (item.id === target ? photo : item))
          : [...photos, photo]
      )
      setRetryFile(null)
    } catch (reason) {
      failure(reason)
    } finally {
      gate.current = false
      setBusy(null)
      onPendingChange?.(false)
    }
  }

  async function save() {
    if (gate.current || !draft || !available) return
    if (!navigator.onLine) {
      setError("offline")

      return
    }

    gate.current = true
    setBusy("save")
    onPendingChange?.(true)
    setError(null)
    try {
      const data = await saveProductGallery(tenantId, productId, {
        assetIds: draft.map((photo) => photo.id),
        expectedIds: expected.current ?? [],
      })

      client.setQueryData(queryKey, data)
      setDraft(null)
      expected.current = null
      setRetryFile(null)
      setSaved(true)
      void query.refetch()
    } catch (reason) {
      failure(reason)
    } finally {
      gate.current = false
      setBusy(null)
      onPendingChange?.(false)
    }
  }

  function retryUpload() {
    const attempt = retryFile

    if (attempt) void upload(attempt.file, attempt.aspect, attempt.target)
  }

  return {
    query,
    photos,
    draft,
    available,
    busy,
    progress,
    error,
    saved,
    change,
    discard,
    upload,
    save,
    retryUpload,
    canRetryUpload: Boolean(retryFile),
  }
}
