"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { ProductPhotoGallery } from "./product-photo-gallery"
import { useProductPhotos } from "@/hooks/use-product-photos"
import type { ProductPhotosProps } from "@/types/product-photos"

export function ProductPhotosEditor(props: ProductPhotosProps) {
  const t = useTranslations("ProductPhotos")
  const state = useProductPhotos(props)
  const [selected, setSelected] = useState(0)
  const [aspect, setAspect] = useState<"1:1" | "4:3">("1:1")
  const [confirm, setConfirm] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const addPhotoButton = useRef<HTMLButtonElement>(null)
  const current = state.photos[selected] ?? state.photos[0]
  const position = current
    ? state.photos.findIndex((photo) => photo.id === current.id)
    : 0
  const locked = !state.available || Boolean(state.busy)
  const id = `photos-${props.productId}`

  function choose() {
    requestAnimationFrame(() => input.current?.click())
  }

  function move(from: number, to: number) {
    const next = [...state.photos]

    if (from < 0 || to < 0 || from >= next.length || to >= next.length) return

    const [photo] = next.splice(from, 1)

    if (!photo) return
    next.splice(to, 0, photo)
    state.change(next)
    setSelected(to)
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-busy={Boolean(state.busy)}
      className="grid w-full min-w-0 content-start gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${id}-title`} className="font-heading font-semibold">
          {t("title")}
        </h3>

        <Badge variant="neutral">
          {t("count", { count: state.photos.length })}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">{t("ordering")}</p>

      <ProductPhotoGallery
        productId={props.productId}
        tenantId={props.tenantId}
        photos={state.photos}
        current={current}
        pending={state.query.isPending}
        error={state.query.isError}
        busy={locked}
        onSelect={setSelected}
        onRemove={(index) => {
          setSelected(index)
          setConfirm(true)
        }}
        onReorder={move}
        onAdd={choose}
        addButtonRef={addPhotoButton}
      />

      <div data-photo-controls className="grid min-w-0 content-start gap-3">
        {current && !state.query.isError && (
          <p className="text-xs text-muted-foreground">
            WebP · {Math.round(current.bytes / 1024)} KB · {current.width} ×{" "}
            {current.height}
          </p>
        )}

        <p className="text-xs/relaxed text-muted-foreground">{t("guidance")}</p>

        <Input
          ref={input}
          id={`${id}-file`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={t("choose")}
          className="hidden"
          disabled={locked}
          multiple
          onChange={(event) => {
            const selectedFiles = [...(event.currentTarget.files ?? [])]

            if (selectedFiles.length > 0)
              void state.uploadMany(selectedFiles, aspect)
            event.currentTarget.value = ""
          }}
        />

        <fieldset disabled={locked} className="grid min-w-0 gap-2">
          <legend className="text-sm font-semibold">{t("framing")}</legend>

          <div
            role="group"
            aria-label={t("framing")}
            className="grid grid-cols-2 gap-2"
          >
            {(
              [
                ["1:1", "squareFraming", "aspect-square w-9"],
                ["4:3", "landscapeFraming", "aspect-[4/3] w-12"],
              ] as const
            ).map(([value, label, frameClass]) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                aria-label={t(label)}
                aria-pressed={aspect === value}
                className={[
                  "flex h-auto min-h-12 flex-col gap-2 border px-3 py-3",
                  aspect === value
                    ? "bg-accent font-semibold hover:bg-accent hover:text-accent-foreground"
                    : "bg-background",
                ].join(" ")}
                onClick={() => setAspect(value)}
              >
                <span
                  aria-hidden="true"
                  className={`block ${frameClass} border-2 border-current`}
                />

                <span>{t(label)}</span>
              </Button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">{t("framingHelp")}</p>
        </fieldset>

        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogPortal>
            <AlertDialogBackdrop />

            <AlertDialogPopup>
              <AlertDialogTitle>
                {t("removePhoto", { number: position + 1 })}
              </AlertDialogTitle>

              <AlertDialogDescription>{t("removeHelp")}</AlertDialogDescription>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 md:min-h-12"
                  disabled={locked || !current}
                  onClick={() => {
                    if (current)
                      state.change(
                        state.photos.filter((photo) => photo.id !== current.id)
                      )
                    setSelected(0)
                    setConfirm(false)
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() =>
                        addPhotoButton.current?.focus()
                      )
                    )
                  }}
                >
                  {t("remove")}
                </Button>

                <AlertDialogClose
                  render={
                    <Button
                      variant="outline"
                      className="min-h-11 md:min-h-12"
                    />
                  }
                >
                  {t("cancel")}
                </AlertDialogClose>
              </div>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialog>

        {state.busy === "upload" && (
          <div role="status" className="grid gap-2 text-sm">
            {t(state.progress === 100 ? "processing" : "uploading", {
              percent: state.progress,
            })}

            <progress
              aria-label={t("progress")}
              value={state.progress}
              max={100}
              className="h-2 w-full accent-primary"
            />
          </div>
        )}

        {state.draft && (
          <>
            <p role="status" className="text-sm font-medium">
              {t("unsaved")}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="min-h-11 whitespace-normal md:min-h-12"
                disabled={locked}
                onClick={() => void state.save()}
              >
                {t(state.busy === "save" ? "saving" : "save")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="min-h-11 whitespace-normal md:min-h-12"
                disabled={Boolean(state.busy)}
                onClick={state.discard}
              >
                {t("discard")}
              </Button>
            </div>
          </>
        )}

        {state.saved && (
          <p role="status" className="text-sm">
            {t("saved")}
          </p>
        )}

        {state.error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t(`errors.${state.error}`)}</AlertDescription>

            {state.canRetryUpload && (
              <Button
                type="button"
                variant="outline"
                className="min-h-11 md:min-h-12"
                disabled={locked}
                onClick={state.retryUpload}
              >
                {t("retryUpload")}
              </Button>
            )}
          </Alert>
        )}

        {(state.query.isError ||
          state.query.data?.storageAvailable === false) && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("unavailable")}</AlertDescription>

            <Button
              type="button"
              variant="outline"
              className="min-h-11 md:min-h-12"
              disabled={state.query.isFetching}
              onClick={() => void state.query.refetch()}
            >
              {t("retry")}
            </Button>
          </Alert>
        )}

        {props.archived && (
          <p className="text-sm text-muted-foreground">{t("archived")}</p>
        )}
      </div>
    </section>
  )
}
