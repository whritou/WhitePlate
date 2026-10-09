"use client"

import { useId, useRef, useState } from "react"
import { Upload, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useBrandSlot } from "@/hooks/use-brand-slot"
import { brandPreviewUrl } from "@/lib/brand-assets"
import { BrandAssetImage } from "@/components/brand/asset-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import type { BrandSlotProps } from "@/types/brand-assets"

export function BrandAssetSlot(props: BrandSlotProps) {
  const { slot, active, available } = props
  const t = useTranslations("BrandAssets")
  const state = useBrandSlot(props)
  const input = useRef<HTMLInputElement>(null)
  const uploadButton = useRef<HTMLButtonElement>(null)
  const id = useId()
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const asset = state.draft ?? active
  const src = asset ? brandPreviewUrl(props.tenantId, asset.id) : undefined
  const locked = Boolean(state.busy) || !available

  return (
    <section
      className={`min-w-0 rounded-lg bg-secondary/60 p-4 ${slot === "banner" ? "@sm:col-span-2" : ""}`}
      aria-labelledby={`${id}-title`}
      aria-busy={Boolean(state.busy)}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <h3 id={`${id}-title`} className="font-heading text-sm font-semibold">
          {t(slot)}
        </h3>

        <Badge variant={state.draft ? "warning" : "neutral"}>
          {t(state.draft ? "draft" : active ? "active" : "fallback")}
        </Badge>
      </div>

      <BrandAssetImage
        key={`${src ?? "empty"}:${previewAttempt}`}
        src={src}
        onError={() => setPreviewError(src ?? null)}
        label={t(src ? "previewImage" : `${slot}Fallback`)}
        className={
          slot === "banner"
            ? "aspect-video w-full rounded-md"
            : "mx-auto mb-3 size-24 rounded-md bg-card"
        }
      />

      {src && previewError === src && (
        <Alert variant="destructive" role="alert" className="mt-3">
          <AlertDescription>{t("previewFailed")}</AlertDescription>

          <Button
            variant="outline"
            className="min-h-11 md:min-h-12"
            onClick={() => {
              setPreviewError(null)
              setPreviewAttempt((attempt) => attempt + 1)
            }}
          >
            {t("retryPreview")}
          </Button>
        </Alert>
      )}

      <p className="mt-3 text-xs/relaxed text-muted-foreground">
        {t(`${slot}Help`)}
      </p>

      {slot === "banner" && (
        <div className="mt-3 grid gap-2">
          <Label htmlFor={`${id}-aspect`}>{t("aspect")}</Label>

          <NativeSelect
            id={`${id}-aspect`}
            className="min-h-11 md:min-h-12"
            value={state.aspect}
            disabled={locked || Boolean(state.draft)}
            onChange={(event) => state.setAspect(event.target.value)}
          >
            <NativeSelectOption value="16:9">16:9</NativeSelectOption>

            <NativeSelectOption value="21:9">21:9</NativeSelectOption>
          </NativeSelect>
        </div>
      )}

      <Input
        ref={input}
        id={id}
        type="file"
        className="hidden"
        disabled={locked}
        aria-label={t("choose", { asset: t(slot) })}
        accept={slot === "favicon" ? ".png,.ico" : ".png,.jpg,.jpeg,.webp"}
        onChange={(event) => {
          const file = event.target.files?.[0]

          if (file) void state.upload(file)
          event.target.value = ""
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          ref={uploadButton}
          variant="outline"
          className="min-h-11 md:min-h-12"
          disabled={locked}
          onClick={() => input.current?.click()}
        >
          <Upload aria-hidden="true" />

          {t(active || state.draft ? "replace" : "upload")}
        </Button>

        {state.draft && (
          <>
            <Button
              className="min-h-11 md:min-h-12"
              disabled={locked}
              onClick={() => void state.save()}
            >
              {t(state.busy === "save" ? "saving" : "save")}
            </Button>

            <Button
              variant="ghost"
              className="min-h-11 md:min-h-12"
              disabled={Boolean(state.busy)}
              onClick={state.discard}
            >
              {t("discard")}
            </Button>
          </>
        )}

        {active && !state.draft && (
          <AlertDialog
            open={state.confirmOpen}
            onOpenChange={state.setConfirmOpen}
          >
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  className="min-h-11 md:min-h-12"
                  disabled={locked}
                  aria-label={t("removeAsset", { asset: t(slot) })}
                />
              }
            >
              <Trash2 aria-hidden="true" />

              {t("remove")}
            </AlertDialogTrigger>

            <AlertDialogPortal>
              <AlertDialogBackdrop />

              <AlertDialogPopup>
                <AlertDialogTitle>
                  {t("removeAsset", { asset: t(slot) })}
                </AlertDialogTitle>

                <AlertDialogDescription>
                  {t("removeHelp")}
                </AlertDialogDescription>

                {state.error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {t(`errors.${state.error}`)}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    className="min-h-11 md:min-h-12"
                    disabled={Boolean(state.busy)}
                    onClick={async () => {
                      if (await state.save(true))
                        requestAnimationFrame(() =>
                          uploadButton.current?.focus()
                        )
                    }}
                  >
                    {t(state.busy ? "saving" : "remove")}
                  </Button>

                  <AlertDialogClose
                    render={
                      <Button
                        variant="outline"
                        className="min-h-11 md:min-h-12"
                        disabled={Boolean(state.busy)}
                      />
                    }
                  >
                    {t("cancel")}
                  </AlertDialogClose>
                </div>
              </AlertDialogPopup>
            </AlertDialogPortal>
          </AlertDialog>
        )}
      </div>

      {state.busy === "upload" && (
        <div role="status" className="mt-3 grid gap-2 text-xs">
          <span>
            {t(state.progress === 100 ? "processing" : "uploading", {
              percent: state.progress,
            })}
          </span>

          <progress
            aria-label={t("uploadProgress")}
            value={state.progress}
            max={100}
            className="h-2 w-full accent-primary"
          />
        </div>
      )}

      {state.error && (
        <Alert variant="destructive" role="alert" className="mt-3">
          <AlertDescription>{t(`errors.${state.error}`)}</AlertDescription>

          {!state.draft && state.file && (
            <Button
              variant="outline"
              className="min-h-11 md:min-h-12"
              disabled={locked}
              onClick={() => void state.upload(state.file!)}
            >
              {t("retry")}
            </Button>
          )}
        </Alert>
      )}

      {state.saved && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          {t("saved")}
        </p>
      )}
    </section>
  )
}
