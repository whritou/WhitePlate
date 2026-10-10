"use client"
import { useTranslations } from "next-intl"
import { Copy } from "@/components/lovable/copy"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DEFAULT_MENU } from "@/lib/lovable/menu"

export function LiveAllergenReference() {
  const t = useTranslations("LiveParity")

  return (
    <section className="mx-auto grid max-w-3xl gap-4 p-6">
      <h2 className="font-display text-2xl font-bold">{t("allergens")}</h2>

      <Alert>
        <AlertDescription>{t("allergenHelp")}</AlertDescription>
      </Alert>

      <ul className="grid gap-3">
        {DEFAULT_MENU.allergens.map((item) => (
          <li key={item.id} className="flex items-center gap-3 border p-3">
            <span aria-hidden="true">{item.icon}</span>

            <span className="font-semibold">
              <Copy>{item.name}</Copy>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
