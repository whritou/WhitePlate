"use client"
import { Copy } from "@/components/lovable/copy"

import { ProductThemePreview } from "@/components/lovable/ProductThemePreview"
export function LandingSection5() {
  return (
    <section id="storefront" className="border-y bg-muted py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-primary">
              <Copy>THEMING STUDIO</Copy>
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              <Copy>One identity.</Copy>

              <br />

              <Copy>Every customer page.</Copy>
            </h2>
          </div>

          <div className="self-end">
            <p className="max-w-xl text-muted-foreground">
              <Copy>
                12 font choices, separate heading and body typography, logo,
                banner and favicon. Fine-tune buttons, photo shapes, spacing and
                restaurant details — and preview the entire journey.
              </Copy>
            </p>

            <p className="mt-4 text-sm font-semibold">
              <Copy>Store · Checkout · Order tracking</Copy>
            </p>
          </div>
        </div>

        <ProductThemePreview />
      </div>
    </section>
  )
}
