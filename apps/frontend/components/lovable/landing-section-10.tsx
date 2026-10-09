"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowRight, Palette } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
export function LandingSection10() {
  return (
    <section className="bg-primary py-16 text-primary-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6">
        <div>
          <h2 className="max-w-xl text-4xl font-bold">
            <Copy>See your restaurant in WhitePlate.</Copy>
          </h2>

          <p className="mt-3 text-sm text-primary-foreground/85">
            <Copy>
              Explore the product today. Create an account when you’re ready.
            </Copy>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Link to="/studio">
              <Copy>View Studio demo</Copy>

              <Palette />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link to="/register">
              <Copy>Create account</Copy>

              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
