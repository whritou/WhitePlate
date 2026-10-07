"use client"

import { Dialog as Primitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"

export const Dialog = Primitive.Root
export const DialogTrigger = Primitive.Trigger
export const DialogClose = Primitive.Close
export const DialogTitle = Primitive.Title
export const DialogDescription = Primitive.Description

export function DialogContent({ className, ...props }: Primitive.Popup.Props) {
  return (
    <Primitive.Portal>
      <Primitive.Backdrop className="fixed inset-0 z-40 bg-black/50" />
      <Primitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed start-1/2 top-1/2 z-40 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none",
          className
        )}
        {...props}
      />
    </Primitive.Portal>
  )
}
