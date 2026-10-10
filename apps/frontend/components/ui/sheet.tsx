"use client"

import { Dialog } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { useVisualScope } from "./visual-scope"
import type { SheetContentProps } from "@/types/ui"

const Sheet = Dialog.Root
const SheetTrigger = Dialog.Trigger
const SheetClose = Dialog.Close
const SheetTitle = Dialog.Title
const SheetDescription = Dialog.Description

function SheetContent({
  side = "right",
  keepMounted,
  className,
  ...props
}: SheetContentProps) {
  const scope = useVisualScope()

  return (
    <Dialog.Portal keepMounted={keepMounted}>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />

      <Dialog.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-40 flex w-[min(20rem,calc(100vw-2.5rem))] min-w-0 flex-col gap-6 overflow-y-auto overscroll-contain border-border bg-popover p-5 text-popover-foreground shadow-xl outline-none motion-reduce:transition-none [&[hidden]]:hidden",
          side === "left"
            ? "left-0 rounded-r-xl border-r"
            : "right-0 rounded-l-xl border-l",
          className,
          scope.className
        )}
        {...props}
        style={{ ...scope.style, ...props.style }}
      />
    </Dialog.Portal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid min-w-0 gap-2", className)} {...props} />
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
