"use client"

import { useEffect, useRef, useState } from "react"
import {
  BrandRequestError,
  saveBrandFile,
  uploadBrandFile,
} from "@/lib/api/brand-browser"
import { brandPreviewUrl, validateBrandFile } from "@/lib/brand-assets"
import type {
  BrandAsset,
  BrandOperationError,
  BrandSlotProps,
} from "@/types/brand-assets"

export function useBrandSlot({
  tenantId,
  slot,
  active,
  onSaved,
  onPreview,
}: BrandSlotProps) {
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<BrandAsset | null>(null)
  const [aspect, setAspect] = useState("16:9")
  const [busy, setBusy] = useState<"upload" | "save" | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<BrandOperationError | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const gate = useRef(false)
  const controller = useRef<AbortController | null>(null)
  const draftRef = useRef<BrandAsset | null>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    const prevent = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    if (draft) window.addEventListener("beforeunload", prevent)

    return () => window.removeEventListener("beforeunload", prevent)
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

  async function upload(selected: File) {
    if (gate.current) return
    setFile(selected)
    setSaved(false)
    setError(null)
    if (!validateBrandFile(slot, selected)) {
      setError("invalid")

      return
    }

    if (!navigator.onLine) {
      setError("offline")

      return
    }

    gate.current = true
    setBusy("upload")
    setProgress(0)
    controller.current = new AbortController()
    try {
      const candidate = await uploadBrandFile(
        tenantId,
        slot,
        aspect,
        selected,
        setProgress,
        controller.current.signal
      )

      draftRef.current = candidate
      setDraft(candidate)
      onPreview(slot, brandPreviewUrl(tenantId, candidate.id))
    } catch (reason) {
      failure(reason)
    } finally {
      gate.current = false
      setBusy(null)
    }
  }

  async function save(remove = false) {
    if (gate.current || (!remove && !draftRef.current)) return false

    if (!navigator.onLine) {
      setError("offline")

      return false
    }

    gate.current = true
    setBusy("save")
    setError(null)
    setSaved(false)
    try {
      await saveBrandFile(
        tenantId,
        slot,
        active?.id ?? "none",
        remove ? null : draftRef.current!.id
      )
      await onSaved(slot, remove ? null : draftRef.current)
      discard()
      setSaved(true)
      setConfirmOpen(false)

      return true
    } catch (reason) {
      failure(reason)
      if (reason instanceof BrandRequestError && reason.code === "conflict")
        await onSaved()

      return false
    } finally {
      gate.current = false
      setBusy(null)
    }
  }

  function discard() {
    draftRef.current = null
    setDraft(null)
    setFile(null)
    onPreview(slot, undefined)
  }

  return {
    file,
    draft,
    aspect,
    setAspect,
    busy,
    progress,
    error,
    saved,
    confirmOpen,
    setConfirmOpen,
    upload,
    save,
    discard,
  }
}
