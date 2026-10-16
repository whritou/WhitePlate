"use client"

import { useRef, useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import {
  deleteCatalogTranslationGlossaryAction,
  saveCatalogTranslationGlossaryAction,
} from "@/actions/organization"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useRouter } from "@/i18n/navigation"
import type { CatalogTranslationGlossaryTerm } from "@/types/catalog-translation-workflow"

export function CatalogTranslationGlossary({
  tenantId,
  locales,
  sourceLocale,
  terms,
}: {
  tenantId: string
  locales: string[]
  sourceLocale: string
  terms: CatalogTranslationGlossaryTerm[]
}) {
  const t = useTranslations("MenuTranslations")
  const uiLocale = useLocale()
  const toast = useWorkspaceToast()
  const router = useRouter()
  const targets = locales.filter((locale) => locale !== sourceLocale)
  const [targetLocale, setTargetLocale] = useState(targets[0] ?? sourceLocale)
  const [sourceTerm, setSourceTerm] = useState("")
  const [targetTerm, setTargetTerm] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<"save" | "delete" | null>(null)
  const locked = useRef(false)
  const visibleTerms = terms.filter(
    (term) =>
      term.sourceLocale === sourceLocale && term.targetLocale === targetLocale
  )
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" })

  function resetForm() {
    setEditingId(null)
    setSourceTerm("")
    setTargetTerm("")
    setError(null)
  }

  function editTerm(term: CatalogTranslationGlossaryTerm) {
    setEditingId(term.id)
    setTargetLocale(term.targetLocale)
    setSourceTerm(term.sourceTerm)
    setTargetTerm(term.targetTerm)
    setError(null)
  }

  async function saveTerm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)

    try {
      const result = await saveCatalogTranslationGlossaryAction({
        tenantId,
        id: editingId,
        sourceLocale,
        targetLocale,
        sourceTerm,
        targetTerm,
      })

      if (!result.ok) {
        setError("save")

        return
      }

      toast.success(t("glossarySaved"))
      resetForm()
      router.refresh()
    } catch {
      setError("save")
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  async function deleteTerm(id: string) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError(null)

    try {
      const result = await deleteCatalogTranslationGlossaryAction({
        tenantId,
        id,
      })

      if (!result.ok) {
        setError("delete")

        return
      }

      setConfirmingId(null)
      if (editingId === id) resetForm()
      toast.success(t("glossaryDeleted"))
      router.refresh()
    } catch {
      setError("delete")
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h3>{t("glossaryTitle")}</h3>
        </CardTitle>

        <CardDescription>{t("glossaryHelp")}</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5">
        {targets.length === 0 ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("glossaryOneLanguage")}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <p className="text-sm font-medium">
                  {t("glossarySourceLanguage")}
                </p>

                <p className="flex min-h-11 items-center rounded-md border border-border bg-muted px-3 py-2 text-sm">
                  {languageNames.of(sourceLocale) ?? sourceLocale} (
                  {sourceLocale})
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="translation-glossary-target">
                  {t("glossaryTargetLanguage")}
                </Label>

                <NativeSelect
                  id="translation-glossary-target"
                  value={targetLocale}
                  onChange={(event) => {
                    setTargetLocale(event.target.value)
                    resetForm()
                  }}
                  selectClassName="w-full"
                  disabled={busy}
                >
                  {targets.map((locale) => (
                    <NativeSelectOption key={locale} value={locale}>
                      {languageNames.of(locale) ?? locale} ({locale})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>

            <form
              onSubmit={(event) => void saveTerm(event)}
              className="grid gap-4 rounded-md border border-border bg-muted p-4 sm:grid-cols-2"
            >
              <Label className="grid gap-2">
                {t("glossarySourceTerm")}

                <Input
                  value={sourceTerm}
                  onChange={(event) => setSourceTerm(event.target.value)}
                  maxLength={120}
                  required
                  disabled={busy}
                />
              </Label>

              <Label className="grid gap-2">
                {t("glossaryTargetTerm")}

                <Input
                  lang={targetLocale}
                  value={targetTerm}
                  onChange={(event) => setTargetTerm(event.target.value)}
                  maxLength={120}
                  required
                  disabled={busy}
                />
              </Label>

              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button type="submit" disabled={busy || !targetLocale}>
                  {editingId ? t("glossarySave") : t("glossaryAdd")}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={busy}
                  >
                    {t("glossaryCancel")}
                  </Button>
                )}
              </div>

              {error === "save" && (
                <p
                  role="alert"
                  className="text-sm text-destructive sm:col-span-2"
                >
                  {t("glossaryError")}
                </p>
              )}
            </form>

            {visibleTerms.length === 0 ? (
              <p role="status" className="text-sm text-muted-foreground">
                {t("glossaryEmpty")}
              </p>
            ) : (
              <ul className="grid gap-3">
                {visibleTerms.map((term) => (
                  <li
                    key={term.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <p className="min-w-0 break-words">
                      <span lang={sourceLocale} className="font-medium">
                        {term.sourceTerm}
                      </span>

                      <span
                        aria-hidden="true"
                        className="px-2 text-muted-foreground"
                      >
                        →
                      </span>

                      <span lang={targetLocale}>{term.targetTerm}</span>
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editTerm(term)}
                        disabled={busy}
                      >
                        {t("glossaryEdit")}
                      </Button>

                      <AlertDialog
                        open={confirmingId === term.id}
                        onOpenChange={(open) =>
                          setConfirmingId(open ? term.id : null)
                        }
                      >
                        <AlertDialogTrigger
                          disabled={busy}
                          render={
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                            />
                          }
                        >
                          {t("glossaryDelete")}
                        </AlertDialogTrigger>

                        <AlertDialogPortal>
                          <AlertDialogBackdrop />

                          <AlertDialogPopup>
                            <AlertDialogTitle>
                              {t("glossaryDelete")}
                            </AlertDialogTitle>

                            <AlertDialogDescription>
                              {term.sourceTerm} → {term.targetTerm}
                            </AlertDialogDescription>

                            <div className="flex flex-wrap justify-end gap-2">
                              <AlertDialogClose
                                disabled={busy}
                                render={
                                  <Button type="button" variant="outline" />
                                }
                              >
                                {t("glossaryCancel")}
                              </AlertDialogClose>

                              <Button
                                type="button"
                                variant="destructive"
                                disabled={busy}
                                onClick={() => void deleteTerm(term.id)}
                              >
                                {t("glossaryDelete")}
                              </Button>
                            </div>

                            {error === "delete" && (
                              <p
                                role="alert"
                                className="text-sm text-destructive"
                              >
                                {t("glossaryDeleteError")}
                              </p>
                            )}
                          </AlertDialogPopup>
                        </AlertDialogPortal>
                      </AlertDialog>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
