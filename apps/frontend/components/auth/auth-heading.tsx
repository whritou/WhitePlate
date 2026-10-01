"use client"

export function AuthHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <header className="mb-7">
      <p className="mb-2 text-sm font-medium text-primary">WhitePlate</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </header>
  )
}
