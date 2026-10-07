"use client"

import { useState } from "react"
import { Pencil, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { EditorDialogProps } from "@/types/editor"

export function EditorDialog({
  title,
  description,
  label,
  icon: Icon = Pencil,
  primary,
  disabled,
  children,
}: EditorDialogProps) {
  const t = useTranslations("Editor")
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(value) => {
        if (!pending) setOpen(value)
      }}
    >
      <DialogTrigger
        disabled={disabled}
        aria-label={title}
        render={
          <Button type="button" variant={primary ? "default" : "outline"} />
        }
      >
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent aria-busy={pending}>
        <header className="relative shrink-0 border-b border-border p-5 pr-16">
          <DialogTitle className="text-xl font-semibold break-words">
            {title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {description}
          </DialogDescription>
          <DialogClose
            disabled={pending}
            aria-label={t("close")}
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
              />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
          {open &&
            children({
              onSuccess: () => setOpen(false),
              onCancel: () => {
                if (!pending) setOpen(false)
              },
              onPendingChange: setPending,
            })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function EditorFormActions({
  pending,
  label,
  onCancel,
}: {
  pending: boolean
  label: string
  onCancel?: () => void
}) {
  const t = useTranslations("Editor")

  return (
    <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-5 sm:col-span-2">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          {t("cancel")}
        </Button>
      )}
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {label}
      </Button>
    </div>
  )
}
