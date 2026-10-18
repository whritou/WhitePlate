"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileQuestion, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function GlobalNotFoundContent() {
  const router = useRouter()

  return (
    <div className="lovable-surface lovable-live lovable-auth flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b px-6 py-5 md:px-10">
        <Link href="/" className="font-display text-2xl font-bold">
          White<span className="text-primary">Plate</span>
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 content-center gap-8 px-6 py-14 md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:px-10">
        <div className="grid size-14 place-items-center border bg-secondary">
          <FileQuestion aria-hidden="true" className="size-7" />
        </div>

        <div
          data-not-found-page="global"
          className="grid justify-items-start gap-6"
        >
          <div className="grid gap-3">
            <p className="label-mono text-primary">404</p>

            <h1 className="font-display text-4xl font-bold">
              <span lang="en">Page not found</span>

              <span aria-hidden="true"> / </span>

              <span lang="fr">Page introuvable</span>
            </h1>

            <p className="max-w-prose text-sm leading-6 text-muted-foreground">
              <span lang="en">
                The address may be incorrect or the page may have moved.
              </span>

              <span aria-hidden="true"> </span>

              <span lang="fr">
                L’adresse est peut-être incorrecte ou la page a été déplacée.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
              Retour / Back
            </Button>

            <Link
              href="/"
              className="btn-primary inline-flex min-h-12 max-w-full items-center justify-center gap-2 px-4 py-2 text-center"
            >
              <Home aria-hidden="true" className="size-4 shrink-0" />
              Accueil / Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
