"use client"
import { Copy } from "@/components/lovable/copy"
import { ShieldCheck, UserRound } from "lucide-react"
import { burger } from "./landing-data"
export function SetupIllustration({
  kind,
}: {
  kind: "account" | "menu" | "studio"
}) {
  return (
    <div className="flex h-44 items-center justify-center border-b bg-muted p-5">
      <Copy>
        {kind === "account" ? (
          <div className="w-full max-w-56 border bg-background p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <UserRound size={17} />

              <Copy>Your WhitePlate account</Copy>
            </div>

            <div className="mt-4 border px-3 py-2 text-xs text-muted-foreground">
              <Copy>you@restaurant.com</Copy>
            </div>

            <div className="mt-2 flex items-center justify-between bg-primary px-3 py-2 text-xs text-primary-foreground">
              <Copy>Email confirmation</Copy>

              <ShieldCheck size={14} />
            </div>
          </div>
        ) : kind === "menu" ? (
          <div className="w-full max-w-56 border bg-background p-3">
            <div className="flex items-center gap-3">
              <img
                src={burger}
                alt="Burger menu photo"
                className="h-20 w-20 object-cover"
              />

              <div>
                <p className="text-sm font-bold">
                  <Copy>Burger Maison</Copy>
                </p>

                <p className="mt-1 text-xs text-primary">€14.50</p>

                <span className="mt-2 inline-block border px-2 py-1 text-xs">
                  <Copy>EN · FR</Copy>
                </span>
              </div>
            </div>

            <p className="mt-3 border-t pt-2 text-xs text-muted-foreground">
              <Copy>Photos · Options · Allergens</Copy>
            </p>
          </div>
        ) : (
          <div className="w-full max-w-56 border bg-background p-4">
            <p className="text-sm font-bold">
              <Copy>Maison Verte</Copy>
            </p>

            <div className="mt-3 flex gap-2">
              <span className="h-6 w-6 bg-primary" />

              <span className="h-6 w-6 bg-accent" />

              <span className="h-6 w-6 bg-ink" />
            </div>

            <div className="mt-3 flex justify-between border-t pt-3 text-xs">
              <span>
                <Copy>Store</Copy>
              </span>

              <span>
                <Copy>Checkout</Copy>
              </span>

              <span>
                <Copy>Tracking</Copy>
              </span>
            </div>
          </div>
        )}
      </Copy>
    </div>
  )
}
