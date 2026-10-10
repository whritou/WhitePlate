"use client"
import { Copy } from "@/components/lovable/copy"
import { Utensils, ImagePlus, Languages, Tag, GripVertical } from "lucide-react"
import { burger, bowl, burrata } from "./landing-data"
export function MenuPreview() {
  return (
    <div className="overflow-hidden border bg-background">
      <div className="flex items-center justify-between border-b bg-muted px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Utensils size={16} />

          <Copy>Menu builder</Copy>
        </span>

        <span className="text-xs text-muted-foreground">
          <Copy>Your menu</Copy>
        </span>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold">
            <Copy>On the menu</Copy>
          </h3>

          <span className="border px-2 py-1 text-xs">
            <Copy>EN / FR</Copy>
          </span>
        </div>

        <Copy>
          {[
            {
              image: burger,
              name: "Burger Maison",
              price: "€14.50",
              detail: "Cheese, extras & cooking preference",
            },
            {
              image: bowl,
              name: "Green bowl",
              price: "€13.50",
              detail: "Seasonal vegetables · Sesame",
            },
            {
              image: burrata,
              name: "Burrata",
              price: "€12.00",
              detail: "Tomatoes & basil · Milk",
            },
          ].map((p) => (
            <div key={p.name} className="flex items-center gap-3 border-t py-4">
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

              <img
                src={p.image}
                alt={p.name}
                className="h-16 w-16 shrink-0 object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  <Copy>{p.name}</Copy>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  <Copy>{p.detail}</Copy>
                </p>
              </div>

              <span className="text-sm font-semibold">
                <Copy>{p.price}</Copy>
              </span>
            </div>
          ))}
        </Copy>

        <div className="mt-3 flex flex-wrap gap-2">
          <Copy>
            {[
              { icon: ImagePlus, label: "Photo galleries" },
              { icon: Languages, label: "Translations" },
              { icon: Tag, label: "Discounts" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 border bg-muted px-3 py-2 text-xs"
              >
                <Icon size={14} />

                <Copy>{label}</Copy>
              </span>
            ))}
          </Copy>
        </div>
      </div>
    </div>
  )
}
