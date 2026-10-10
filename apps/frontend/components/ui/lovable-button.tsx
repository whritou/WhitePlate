"use client"

import { isValidElement } from "react"
import { Button as BaseButton } from "./button"
import { cn } from "@/lib/utils"
import type { LovableButtonProps } from "@/types/lovable-adapters"
import { useLovableText } from "@/components/lovable/copy"

export function Button({
  asChild,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: LovableButtonProps) {
  const text = useLovableText()
  const element =
    asChild && isValidElement<{ children?: React.ReactNode }>(children)
      ? children
      : undefined
  const styles = {
    default:
      "border-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 active:bg-primary/90",
    outline:
      "border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:border-input active:bg-accent",
    secondary:
      "border-0 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:bg-secondary/80",
    ghost:
      "border-0 hover:bg-accent hover:text-accent-foreground active:bg-accent",
    link: "border-0 text-primary no-underline hover:underline active:bg-transparent",
    destructive:
      "border-0 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:bg-destructive/90",
    heroPrimary:
      "border-accent bg-accent text-accent-foreground hover:border-hero-primary-hover hover:bg-hero-primary-hover active:border-hero-primary-hover active:bg-hero-primary-hover",
    heroSecondary:
      "border-ink-foreground/60 bg-ink/70 text-ink-foreground hover:border-ink-foreground hover:bg-ink-foreground hover:text-ink active:border-ink-foreground active:bg-ink-foreground active:text-ink",
  }
  const sourceSize =
    size === "sm"
      ? "min-h-11 px-3 text-xs"
      : size === "lg"
        ? "min-h-11 px-8 text-sm"
        : size === "icon"
          ? "min-h-11 min-w-11 text-sm"
          : "min-h-11 px-4 py-2 text-sm"

  return (
    <BaseButton
      {...props}
      aria-label={text(props["aria-label"])}
      title={text(props.title)}
      variant="unstyled"
      size={size}
      nativeButton={!element}
      render={element}
      className={cn(
        "lovable-button cursor-pointer rounded-none font-medium",
        sourceSize,
        styles[variant],
        className
      )}
    >
      {element ? element.props.children : children}
    </BaseButton>
  )
}
