"use client"

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import type {
  AlertDialogBackdropProps,
  AlertDialogCloseProps,
  AlertDialogDescriptionProps,
  AlertDialogPopupProps,
  AlertDialogPortalProps,
  AlertDialogRootProps,
  AlertDialogTitleProps,
  AlertDialogTriggerProps,
} from "@base-ui/react/alert-dialog"
import { cn } from "@/lib/utils"

function AlertDialog(props: AlertDialogRootProps) {
  return <AlertDialogPrimitive.Root {...props} />
}

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal(props: AlertDialogPortalProps) {
  return <AlertDialogPrimitive.Portal {...props} />
}

function AlertDialogBackdrop({
  className,
  ...props
}: AlertDialogBackdropProps) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-backdrop"
      className={cn(
        "fixed inset-0 z-40 bg-black/50 transition-opacity duration-(--duration-overlay) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogPopup({ className, ...props }: AlertDialogPopupProps) {
  return (
    <AlertDialogPrimitive.Popup
      data-slot="alert-dialog-popup"
      className={cn(
        "fixed start-1/2 top-1/2 z-40 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-lg transition-[opacity,scale] duration-(--duration-overlay) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("font-heading text-xl font-semibold", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-sm/relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogClose(props: AlertDialogCloseProps) {
  return (
    <AlertDialogPrimitive.Close data-slot="alert-dialog-close" {...props} />
  )
}

export {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPortal,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
}
