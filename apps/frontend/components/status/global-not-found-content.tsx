"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileQuestion, Home } from "lucide-react"

export function GlobalNotFoundContent() {
  const router = useRouter()

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4 text-foreground sm:p-6">
      <section
        data-not-found-page="global"
        className="grid w-full max-w-3xl gap-6 rounded-lg border border-border bg-card p-6 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-8 sm:p-10"
      >
        <div className="grid size-14 place-items-center rounded-lg bg-accent text-primary">
          <FileQuestion aria-hidden="true" className="size-7" />
        </div>

        <div className="grid justify-items-start gap-4">
          <p className="text-sm font-semibold text-primary">404</p>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-[2rem]">
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

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-center font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
              Retour / Back
            </button>

            <Link
              href="/"
              className="inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-center font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Home aria-hidden="true" className="size-4 shrink-0" />
              Accueil / Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
