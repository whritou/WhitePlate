"use client"
import { Copy } from "@/components/lovable/copy"
import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/lovable-button"
import { faqs } from "./landing-data"
export function LandingSection9() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[.8fr_1.2fr]"
    >
      <div>
        <p className="text-xs font-semibold text-primary">
          <Copy>GOOD TO KNOW</Copy>
        </p>

        <h2 className="mt-4 text-4xl font-bold">
          <Copy>The details,</Copy>

          <br />

          <Copy>without the small print.</Copy>
        </h2>
      </div>

      <div>
        <Copy>
          {faqs.map((f, i) => (
            <div key={f.q} className="border-b">
              <Button
                variant="ghost"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="h-auto w-full justify-between gap-4 px-0 py-5 text-left whitespace-normal hover:bg-transparent"
              >
                <span className="text-base font-semibold">
                  <Copy>{f.q}</Copy>
                </span>

                <ChevronDown
                  className={`shrink-0 text-primary transition-transform ${open === i ? "rotate-180" : ""}`}
                />
              </Button>

              <Copy>
                {open === i && (
                  <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    <Copy>{f.a}</Copy>
                  </p>
                )}
              </Copy>
            </div>
          ))}
        </Copy>
      </div>
    </section>
  )
}
