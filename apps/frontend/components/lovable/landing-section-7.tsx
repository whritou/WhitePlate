"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { SetupIllustration } from "./SetupIllustration"
export function LandingSection7() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-xs font-semibold text-primary">
        <Copy>GET STARTED</Copy>
      </p>

      <h2 className="mt-4 text-4xl font-bold md:text-5xl">
        <Copy>Make it yours, one step at a time.</Copy>
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Copy>
          {[
            {
              kind: "account",
              title: "Create your account",
              text: "Register with your name and email, confirm your address and log in to WhitePlate.",
              to: "/register",
              action: "Create account",
            },
            {
              kind: "menu",
              title: "Build your menu",
              text: "Add dishes, photos, extras, categories, allergens and translations in the browser-based builder.",
              to: "/menu",
              action: "View menu builder demo",
            },
            {
              kind: "studio",
              title: "Shape your storefront",
              text: "Customize your brand and preview the store, checkout and tracking. Bring your restaurant identity to every customer page.",
              to: "/studio",
              action: "View Studio demo",
            },
          ].map((s) => (
            <article key={s.title} className="overflow-hidden border">
              <SetupIllustration
                kind={s.kind as "account" | "menu" | "studio"}
              />

              <div className="p-6">
                <h3 className="text-xl font-bold">
                  <Copy>{s.title}</Copy>
                </h3>

                <p className="mt-3 text-sm text-muted-foreground">
                  <Copy>{s.text}</Copy>
                </p>

                <Button asChild variant="link" className="mt-4 px-0">
                  <Link to={s.to}>
                    <Copy>{s.action}</Copy>

                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </Copy>
      </div>
    </section>
  )
}
