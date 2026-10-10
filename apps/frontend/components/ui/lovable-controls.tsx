"use client"

import type { ComponentProps } from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Label } from "./label"
import { NativeSelect, NativeSelectOption } from "./native-select"
import { useLovableText } from "@/components/lovable/copy"
import { cn } from "@/lib/utils"

export function SourceButton({
  className,
  ...props
}: ComponentProps<"button">) {
  const text = useLovableText()

  return (
    <Button
      variant="unstyled"
      className={cn(
        "lovable-source-button inline-flex min-h-11 min-w-11 rounded-none border-0 p-0 text-inherit hover:bg-transparent",
        className
      )}
      {...props}
      aria-label={text(props["aria-label"])}
      title={text(props.title)}
    />
  )
}

export function SourceInput(props: ComponentProps<"input">) {
  const text = useLovableText()
  const nativeChoice = props.type === "checkbox" || props.type === "radio"
  const nativeRange = props.type === "range" || props.type === "color"
  const classes =
    props.type === "file" && props.className === "hidden"
      ? "sr-only"
      : props.className

  return (
    <Input
      data-source-control="true"
      {...props}
      className={cn(
        "rounded-none",
        nativeChoice &&
          "h-auto min-h-0 w-auto min-w-0 shrink-0 border-0 bg-transparent p-0",
        nativeRange && "min-h-0 border-0 bg-transparent p-0",
        classes
      )}
      placeholder={text(props.placeholder)}
      aria-label={text(props["aria-label"])}
    />
  )
}

export function SourceTextarea(props: ComponentProps<"textarea">) {
  const text = useLovableText()

  return (
    <Textarea
      data-source-control="true"
      {...props}
      className={cn("rounded-none", props.className)}
      placeholder={text(props.placeholder)}
      aria-label={text(props["aria-label"])}
    />
  )
}

export function SourceLabel(props: ComponentProps<"label">) {
  return (
    <Label
      {...props}
      className={cn(
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
        props.className
      )}
    />
  )
}

export function SourceSelect({
  className,
  ...props
}: Omit<ComponentProps<"select">, "size">) {
  const text = useLovableText()

  return (
    <NativeSelect
      data-source-control="true"
      className="w-auto max-w-full"
      selectClassName={cn("rounded-none", className)}
      {...props}
      aria-label={text(props["aria-label"])}
      title={text(props.title)}
    />
  )
}

export const SourceOption = NativeSelectOption
