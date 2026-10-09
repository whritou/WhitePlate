"use client"

import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <CardHeader className="mb-7 px-0">
      <p className="mb-2 text-sm font-medium text-brand-text">WhitePlate</p>

      <CardTitle className="text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
        <h1>{title}</h1>
      </CardTitle>

      <CardDescription className="mt-2 text-sm leading-6">
        {description}
      </CardDescription>
    </CardHeader>
  )
}
