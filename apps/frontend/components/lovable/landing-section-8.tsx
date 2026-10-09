"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { plans } from "./landing-data"
export function LandingSection8() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="border-y bg-muted py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold text-primary">
            <Copy>SUBSCRIPTIONS</Copy>
          </p>

          <h2 className="mt-4 text-4xl font-bold md:text-5xl">
            <Copy>A plan for every kind of restaurant.</Copy>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
            <Copy>
              Choose the right fit for your team. Save 20% with annual billing.
            </Copy>
          </p>

          <div className="mt-7 inline-flex max-w-full flex-wrap border bg-background p-1">
            <Copy>
              {[false, true].map((value) => (
                <Button
                  key={String(value)}
                  variant={annual === value ? "default" : "ghost"}
                  aria-pressed={annual === value}
                  onClick={() => setAnnual(value)}
                >
                  <Copy>{value ? "Annual · save 20%" : "Monthly"}</Copy>
                </Button>
              ))}
            </Copy>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Copy>
            {plans.map((p) => (
              <article
                key={p.name}
                className="flex flex-col border bg-background p-7"
              >
                <Copy>
                  {p.featured && (
                    <span className="mb-3 w-fit bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                      <Copy>GROWING TEAMS</Copy>
                    </span>
                  )}
                </Copy>

                <h3 className="text-2xl font-bold">
                  <Copy>{p.name}</Copy>
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  <Copy>{p.subtitle}</Copy>
                </p>

                <p className="mt-6 text-4xl font-bold">
                  €<Copy>{annual ? (p.price * 0.8).toFixed(2) : p.price}</Copy>
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    <Copy> / month</Copy>
                  </span>
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  <Copy>
                    {annual
                      ? `Billed annually: €${(p.price * 0.8 * 12).toFixed(2)}`
                      : "Monthly billing"}
                  </Copy>
                </p>

                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  <Copy>
                    {p.items.map((x) => (
                      <li key={x} className="flex gap-2">
                        <Check size={16} className="shrink-0 text-primary" />

                        <Copy>{x}</Copy>
                      </li>
                    ))}
                  </Copy>
                </ul>

                <Button
                  asChild
                  variant={p.featured ? "default" : "outline"}
                  className="mt-8 h-11"
                >
                  <Link to="/register">
                    <Copy>Create account</Copy>

                    <ArrowRight />
                  </Link>
                </Button>
              </article>
            ))}
          </Copy>
        </div>
      </div>
    </section>
  )
}
