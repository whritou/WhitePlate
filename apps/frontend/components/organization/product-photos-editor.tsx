"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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
  const [aspect, setAspect] = useState("1:1")
  const [replaceMode, setReplaceMode] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const target = useRef<string | undefined>(undefined)
  const current = state.photos[selected] ?? state.photos[0]
  const position = current
    ? state.photos.findIndex((photo) => photo.id === current.id)
    : 0
  const locked = !state.available || Boolean(state.busy)
  const id = `photos-${props.productId}`

  function choose(replace: boolean) {
    setReplaceMode(replace)
    target.current = replace ? current?.id : undefined
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
        <Badge variant="neutral">{t("count", { count: state.photos.length })}</Badge>
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
        onAdd={() => choose(false)}
      />

      <div data-photo-controls className="grid min-w-0 content-start gap-3">
        {current && !state.query.isError && (
          <p className="text-xs text-muted-foreground">
            WebP · {Math.round(current.bytes / 1024)} KB · {current.width} × {current.height}
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
          multiple={!replaceMode}
          onChange={(event) => {
            const selectedFiles = [...(event.currentTarget.files ?? [])]
            const replacement = target.current
            const files = replacement ? selectedFiles.slice(0, 1) : selectedFiles
            if (files.length > 0) void state.uploadMany(files, aspect, replacement)
            target.current = undefined
            setReplaceMode(false)
            event.currentTarget.value = ""
          }}
        />

        <Label htmlFor={`${id}-aspect`} className="grid min-w-0 gap-2">
          {t("framing")}
          <NativeSelect
            id={`${id}-aspect`}
            aria-label={t("framing")}
            value={aspect}
            disabled={locked}
            selectClassName="min-h-11 md:min-h-12"
            onChange={(event) => setAspect(event.target.value)}
          >
            <NativeSelectOption value="1:1">1:1</NativeSelectOption>
            <NativeSelectOption value="4:3">4:3</NativeSelectOption>
          </NativeSelect>
        </Label>

        {current && !state.query.isError && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 whitespace-normal md:min-h-12"
            disabled={locked}
            onClick={() => choose(true)}
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            {t("replace")}
          </Button>
        )}

        <AlertDialog open={confirm} onOpenChange={setConfirm}>
          <AlertDialogPortal>
            <AlertDialogBackdrop />
            <AlertDialogPopup>
              <AlertDialogTitle>{t("removePhoto", { number: position + 1 })}</AlertDialogTitle>
              <AlertDialogDescription>{t("removeHelp")}</AlertDialogDescription>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="min-h-11 md:min-h-12"
                  disabled={locked || !current}
                  onClick={() => {
                    if (current) state.change(state.photos.filter((photo) => photo.id !== current.id))
                    setSelected(0)
                    setConfirm(false)
                  }}
                >
                  {t("remove")}
                </Button>
                <AlertDialogClose
                  render={<Button variant="outline" className="min-h-11 md:min-h-12" />}
                >
                  {t("cancel")}
                </AlertDialogClose>
              </div>
            </AlertDialogPopup>
          </AlertDialogPortal>
        </AlertDialog>

        {state.busy === "upload" && (
          <div role="status" className="grid gap-2 text-sm">
            {t(state.progress === 100 ? "processing" : "uploading", { percent: state.progress })}
            <progress aria-label={t("progress")} value={state.progress} max={100} className="h-2 w-full accent-primary" />
          </div>
        )}

        {state.draft && (
          <>
            <p role="status" className="text-sm font-medium">{t("unsaved")}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="min-h-11 whitespace-normal md:min-h-12" disabled={locked} onClick={() => void state.save()}>
                {t(state.busy === "save" ? "saving" : "save")}
              </Button>
              <Button type="button" variant="ghost" className="min-h-11 whitespace-normal md:min-h-12" disabled={Boolean(state.busy)} onClick={state.discard}>
                {t("discard")}
              </Button>
            </div>
          </>
        )}

        {state.saved && <p role="status" className="text-sm">{t("saved")}</p>}
        {state.error && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t(`errors.${state.error}`)}</AlertDescription>
            {state.canRetryUpload && (
              <Button type="button" variant="outline" className="min-h-11 md:min-h-12" disabled={locked} onClick={state.retryUpload}>
                {t("retryUpload")}
              </Button>
            )}
          </Alert>
        )}
        {(state.query.isError || state.query.data?.storageAvailable === false) && (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{t("unavailable")}</AlertDescription>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-12" disabled={state.query.isFetching} onClick={() => void state.query.refetch()}>
              {t("retry")}
            </Button>
          </Alert>
        )}
        {props.archived && <p className="text-sm text-muted-foreground">{t("archived")}</p>}
      </div>
    </section>
  )
}
