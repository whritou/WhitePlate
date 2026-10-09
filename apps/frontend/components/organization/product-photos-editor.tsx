"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ImagePlus, Trash2, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"
import { ProductPhotoImage } from "@/components/product/photo-image"
import { useProductPhotos } from "@/hooks/use-product-photos"
import type { ProductPhotosProps } from "@/types/product-photos"

export function ProductPhotosEditor(props: ProductPhotosProps) {
  const t = useTranslations("ProductPhotos")
  const state = useProductPhotos(props)
  const [selected, setSelected] = useState(0)
  const [aspect, setAspect] = useState("1:1")
  const [confirm, setConfirm] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const add = useRef<HTMLButtonElement>(null)
  const target = useRef<string | undefined>(undefined)
  const current = state.photos[selected] ?? state.photos[0]
  const position = current
    ? state.photos.findIndex((photo) => photo.id === current.id)
    : 0
  const locked = !state.available || Boolean(state.busy)
  const id = `photos-${props.productId}`

  function choose(replace: boolean) {
    target.current = replace ? current?.id : undefined
    input.current?.click()
  }

  function move(offset: number) {
    const next = [...state.photos]
    const other = position + offset

    if (other < 0 || other >= next.length) return
    ;[next[position], next[other]] = [next[other], next[position]]
    state.change(next)
    setSelected(other)
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      aria-busy={Boolean(state.busy)}
      className="grid w-full max-w-[24rem] min-w-0 content-start gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${id}-title`} className="font-heading font-semibold">
          {t("title")}
        </h3>

        <Badge variant="neutral">
          {t("count", { count: state.photos.length })}
        </Badge>
      </div>

      {state.query.isPending ? (
        <Skeleton className="aspect-square w-full" />
      ) : (
        <ProductPhotoImage
          key={current?.id ?? "fallback"}
          productId={props.productId}
          photo={state.query.isError ? undefined : current}
          tenantId={props.tenantId}
          size={640}
        />
      )}

      {!state.query.isError && state.photos.length > 0 && (
        <div className="flex min-w-0 flex-wrap gap-2" aria-label={t("gallery")}>
          {state.photos.map((photo, index) => (
            <Button
              key={photo.id}
              variant="outline"
              className="size-14 p-1"
              aria-label={t("showPhoto", { number: index + 1 })}
              aria-pressed={current?.id === photo.id}
              disabled={Boolean(state.busy)}
              onClick={() => setSelected(index)}
            >
              <ProductPhotoImage
                productId={props.productId}
                photo={photo}
                tenantId={props.tenantId}
                size={320}
                square
                className="size-11"
              />
            </Button>
          ))}
        </div>
      )}

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
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]

          if (file) void state.upload(file, aspect, target.current)
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

      <div className="flex min-w-0 flex-wrap gap-2">
        <Button
          ref={add}
          type="button"
          variant="outline"
          className="min-h-11 max-w-full whitespace-normal md:min-h-12"
          disabled={locked || state.photos.length >= 8}
          onClick={() => choose(false)}
        >
          <ImagePlus aria-hidden="true" className="size-4 shrink-0" />

          {t("add")}
        </Button>

        {current && !state.query.isError && (
          <>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 whitespace-normal md:min-h-12"
              disabled={locked}
              onClick={() => choose(true)}
            >
              {t("replace")}
            </Button>

            <AlertDialog open={confirm} onOpenChange={setConfirm}>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 whitespace-normal md:min-h-12"
                    disabled={locked}
                    aria-label={t("removePhoto", { number: position + 1 })}
                  />
                }
              >
                <Trash2 aria-hidden="true" className="size-4" />

                {t("remove")}
              </AlertDialogTrigger>

              <AlertDialogPortal>
                <AlertDialogBackdrop />

                <AlertDialogPopup finalFocus={add}>
                  <AlertDialogTitle>
                    {t("removePhoto", { number: position + 1 })}
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    {t("removeHelp")}
                  </AlertDialogDescription>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="min-h-11 md:min-h-12"
                      onClick={() => {
                        state.change(
                          state.photos.filter(
                            (photo) => photo.id !== current.id
                          )
                        )
                        setSelected(0)
                        setConfirm(false)
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

            {position === 0 ? (
              <Badge variant="neutral">{t("cover")}</Badge>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 whitespace-normal md:min-h-12"
                disabled={locked}
                onClick={() => {
                  state.change([
                    current,
                    ...state.photos.filter((photo) => photo.id !== current.id),
                  ])
                  setSelected(0)
                }}
              >
                {t("makeCover")}
              </Button>
            )}

            {state.photos.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 md:size-12"
                  disabled={locked || position === 0}
                  aria-label={t("earlier")}
                  onClick={() => move(-1)}
                >
                  <ArrowLeft aria-hidden="true" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-11 md:size-12"
                  disabled={locked || position === state.photos.length - 1}
                  aria-label={t("later")}
                  onClick={() => move(1)}
                >
                  <ArrowRight aria-hidden="true" />
                </Button>
              </>
            )}
          </>
        )}
      </div>

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
    </section>
  )
}
