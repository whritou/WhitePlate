"use client"
import { useLocale } from "next-intl"
import { Link, usePathname } from "@/i18n/navigation"

export function LocaleControl() {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <nav aria-label="Language / Langue" className="flex gap-1">
      {(["en", "fr"] as const).map((language) => (
        <Link
          key={language}
          href={pathname}
          locale={language}
          lang={language}
          aria-current={locale === language ? "true" : undefined}
          className="grid size-11 place-items-center border text-xs font-semibold uppercase"
        >
          {language}
        </Link>
      ))}
    </nav>
  )
}
