"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { tools } from "./landing-data"
export function LandingSection6() {
  return (
    <section id="workspace" className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold text-primary">
            <Copy>BACK OFFICE</Copy>
          </p>

          <h2 className="mt-4 text-4xl font-bold md:text-5xl">
            <Copy>Beyond the order board.</Copy>
          </h2>
        </div>

        <Button asChild variant="outline">
          <Link to="/dashboard">
            <Copy>View workspace demo</Copy>

            <ArrowUpRight />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Copy>
          {tools.map(({ icon: Icon, title, text, to, status }) => (
            <article key={title} className="flex flex-col border p-6">
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-6 w-6 text-primary" />

                <span className="bg-muted px-2 py-1 text-xs text-muted-foreground">
                  <Copy>{status}</Copy>
                </span>
              </div>

              <h3 className="mt-6 text-xl font-bold">
                <Copy>{title}</Copy>
              </h3>

              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                <Copy>{text}</Copy>
              </p>

              <Button
                asChild
                variant="link"
                className="mt-5 justify-start px-0"
              >
                <Link to={to}>
                  <Copy>
                    {to === "/register" ? "Create account" : "View demo"}
                  </Copy>

                  <ArrowUpRight />
                </Link>
              </Button>
            </article>
          ))}
        </Copy>
      </div>
    </section>
  )
}
