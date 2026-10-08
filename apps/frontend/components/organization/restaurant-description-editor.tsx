"use client"

import { useRouter } from "@/i18n/navigation"
import { saveRestaurantDescriptionTranslationAction } from "@/actions/organization"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import type { RestaurantDescriptionTranslations } from "@/types/catalog"
import { useLocale, useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"

export function RestaurantDescriptionEditor({
  tenantId,
  locales,
  defaultLocale,
  translations: initialTranslations,
  onPendingChange,
}: RestaurantDescriptionTranslations & {
  onPendingChange?: (pending: boolean) => void
}) {
  const t = useTranslations("RestaurantDescription")
  const uiLocale = useLocale()
  const router = useRouter()
  const [chosenLocale, setLocale] = useState(defaultLocale)
  const locale = locales.includes(chosenLocale) ? chosenLocale : defaultLocale
  const [translations, setTranslations] = useState(initialTranslations)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const draft = drafts[locale] ?? translations[locale] ?? ""
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const submitting = useRef(false)
  const names = new Intl.DisplayNames([uiLocale], { type: "language" })
  const fallback = translations[locale] ?? translations[defaultLocale] ?? ""

  function changeLocale(nextLocale: string) {
    setLocale(nextLocale)
    setError(false)
    setSaved(false)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    onPendingChange?.(true)
    setError(false)
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await saveRestaurantDescriptionTranslationAction({
          tenantId,
          locale,
          description: draft,
        })

        if (!result.ok) {
          setError(true)

          return
        }

        setTranslations((current) => {
          const next = { ...current }

          if (draft.trim()) next[locale] = draft.trim()
          else delete next[locale]

          return next
        })
        setDrafts((current) => ({ ...current, [locale]: draft.trim() }))
        setSaved(true)
        router.refresh()
      } catch {
        setError(true)
      } finally {
        submitting.current = false
        onPendingChange?.(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t("title")}</h2>
        </CardTitle>

        <CardDescription className="mt-2 max-w-2xl">
          {t("help", { language: names.of(defaultLocale) ?? defaultLocale })}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={submit} aria-busy={pending}>
          <div className="grid gap-2 sm:max-w-[24rem]">
            <Label htmlFor="restaurant-description-locale">
              {t("language")}
            </Label>

            <NativeSelect
              id="restaurant-description-locale"
              value={locale}
              disabled={pending}
              onChange={(event) => changeLocale(event.target.value)}
              selectClassName="w-full"
            >
              {locales.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {names.of(value) ?? value} ({value})
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {locale !== defaultLocale && !translations[locale] && fallback && (
            <p className="text-sm text-muted-foreground">{t("fallback")}</p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="restaurant-description">{t("fieldLabel")}</Label>

            <Textarea
              id="restaurant-description"
              lang={locale}
              value={draft}
              maxLength={500}
              rows={4}
              disabled={pending}
              aria-describedby="restaurant-description-count"
              className="w-full resize-y"
              onChange={(event) => {
                setDrafts((current) => ({
                  ...current,
                  [locale]: event.target.value,
                }))
                setSaved(false)
              }}
            />

            <p
              id="restaurant-description-count"
              className="text-sm text-muted-foreground"
            >
              {t("characterCount", { count: draft.length })}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{t("saveError")}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("saved")}
            </p>
          )}

          <div>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
