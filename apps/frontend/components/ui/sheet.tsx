"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import type { SheetContentProps } from "@/types/ui"

const Sheet = Dialog.Root
const SheetTrigger = Dialog.Trigger
const SheetClose = Dialog.Close
const SheetTitle = Dialog.Title
const SheetDescription = Dialog.Description

function SheetContent({
  side = "right",
  className,
  ...props
}: SheetContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />

      <Dialog.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-40 flex w-[min(20rem,calc(100vw-2.5rem))] flex-col gap-6 overflow-y-auto overscroll-contain border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none motion-reduce:transition-none",
          side === "left"
            ? "left-0 rounded-r-xl border-r"
            : "right-0 rounded-l-xl border-l",
          className
        )}
        {...props}
      />
    </Dialog.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-2", className)} {...props} />
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
