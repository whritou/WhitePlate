"use client"

import { Card } from "@/components/ui/card"
import { Brand } from "@/components/ui/brand"
import { Link } from "@/i18n/navigation"
import Image from "next/image"

export function AuthFrame({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <main className="relative mx-auto min-h-svh max-w-7xl bg-background px-4 pt-28 pb-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,30rem)] lg:items-center lg:gap-16 lg:px-12 lg:pb-14">
      <Link href="/" className="absolute top-8 left-6 lg:left-12">
        <Brand />
      </Link>

      <section className="mx-auto w-full max-w-[28rem] lg:order-2">
        {children}
      </section>

      <aside className="mx-auto mt-10 hidden w-full max-w-2xl lg:order-1 lg:block">
        <Card className="relative min-h-[38rem] justify-end gap-0 overflow-hidden rounded-lg border-0 bg-obsidian px-10 py-12 text-white xl:px-14 xl:py-16 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-white/75">
          <Image
            src="/design/photo-13.webp"
            alt=""
            fill
            sizes="50vw"
            className="object-cover opacity-35"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/50 to-transparent" />

          <div className="relative z-10">{aside}</div>
        </Card>
      </aside>
    </main>
  )
}
