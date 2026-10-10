"use client"
import { Copy } from "@/components/lovable/copy"
import { Link } from "@/components/lovable/navigation"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { hero } from "./landing-data"
export function LandingSection2() {
  return (
    <section className="relative overflow-hidden border-b bg-ink text-ink-foreground">
      <img
        src={hero}
        alt="Restaurant dish and takeaway bag"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="landing-hero-shade absolute inset-0" />

      <div className="relative mx-auto flex min-h-[600px] max-w-7xl flex-col justify-center px-6 py-20">
        <span className="mb-6 w-fit border border-ink-foreground/30 bg-ink/80 px-3 py-2 text-xs font-semibold">
          <Copy>RESTAURANT CLICK & COLLECT</Copy>
        </span>

        <h1 className="max-w-3xl text-6xl leading-none font-bold sm:text-7xl">
          <Copy>WhitePlate</Copy>
        </h1>

        <p className="mt-6 max-w-xl text-3xl leading-tight font-medium">
          <Copy>Your menu. Your storefront.</Copy>

          <br />

          <Copy>Your service, all in one place.</Copy>
        </p>

        <p className="mt-5 max-w-lg text-base text-ink-foreground/85">
          <Copy>
            Build a rich menu, shape every customer page and organize your
            restaurant workspace — from the order board to the end-of-day
            report.
          </Copy>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" variant="heroPrimary" className="h-12">
            <Link to="/register">
              <Copy>Create account</Copy>

              <ArrowRight />
            </Link>
          </Button>

          <Button asChild size="lg" variant="heroSecondary" className="h-12">
            <Link to="/dashboard">
              <Copy>View workspace demo</Copy>

              <ArrowUpRight />
            </Link>
          </Button>
        </div>

        <p className="mt-5 text-xs text-ink-foreground/75">
          <Copy>
            Made for independent restaurants and multi-location teams.
          </Copy>
        </p>
      </div>
    </section>
  )
}
