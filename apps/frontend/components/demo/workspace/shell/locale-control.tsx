"use client"
import { useLocale } from "next-intl"
import { Link, usePathname, useRouter } from "@/i18n/navigation"

export function LocaleControl() {
  const pathname = usePathname()
  const locale = useLocale()
  const router = useRouter()

  return (
    <nav aria-label="Language / Langue" className="flex gap-1">
      {(["en", "fr"] as const).map((language) => (
        <Link
          key={language}
          href={pathname}
          locale={language}
          onClick={(event) => {
            event.preventDefault()
            router.replace(
              pathname + window.location.search + window.location.hash,
              { locale: language }
            )
          }}
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
