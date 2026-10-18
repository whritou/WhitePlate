"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { saveOpeningHoursAction } from "@/actions/establishment-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type {
  EstablishmentSettings,
  OpeningHoursSchedule,
} from "@/types/establishment-settings"
import { OpeningHoursCopyPanel } from "./opening-hours-copy-panel"

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const
const emptySchedule = (): OpeningHoursSchedule => ({
  days: weekdays.map((_, index) => ({
    dayOfWeek: index + 1,
    isClosed: true,
    windows: [],
  })),
})

export function OpeningHoursEditor({
  tenantId,
  settings,
  onSaved,
}: {
  tenantId: string
  settings: EstablishmentSettings
  onSaved: (settings: EstablishmentSettings) => void | Promise<void>
}) {
  const t = useTranslations("OpeningHours")
  const [schedule, setSchedule] = useState(settings.openingHours)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState(false)
  const [pending, startTransition] = useTransition()
  const dirty =
    JSON.stringify(schedule) !== JSON.stringify(settings.openingHours)

  function updateDay(
    index: number,
    update: (
      day: OpeningHoursSchedule["days"][number]
    ) => OpeningHoursSchedule["days"][number]
  ) {
    const current = schedule ?? emptySchedule()

    setSchedule({
      ...current,
      days: current.days.map((day, dayIndex) =>
        dayIndex === index ? update(day) : day
      ),
    })
    setNotice(false)
    setError(null)
  }

  function save() {
    if (!schedule || pending) return
    setError(null)
    startTransition(async () => {
      const result = await saveOpeningHoursAction({
        tenantId,
        establishmentVersion: settings.establishmentVersion,
        openingHours: schedule,
      })

      if (result.ok && result.data) {
        setSchedule(result.data.openingHours)
        setNotice(true)
        await onSaved(result.data)
      } else setError(result.ok ? "unavailable" : result.error)
    })
  }

  function clear() {
    if (pending || !settings.openingHours) return
    if (!window.confirm(t("clearConfirm"))) return

    startTransition(async () => {
      const result = await saveOpeningHoursAction({
        tenantId,
        establishmentVersion: settings.establishmentVersion,
        openingHours: null,
      })

      if (result.ok && result.data) {
        setSchedule(null)
        setNotice(true)
        setError(null)
        await onSaved(result.data)
      } else setError(result.ok ? "unavailable" : result.error)
    })
  }

  return (
    <section
      className="grid gap-4 border-t pt-6"
      aria-labelledby="opening-hours-heading"
    >
      <div className="grid gap-1">
        <h2
          id="opening-hours-heading"
          className="font-display text-xl font-bold"
        >
          {t("title")}
        </h2>

        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {!schedule ? (
        <div className="grid justify-items-start gap-3">
          <p className="text-sm">{t("notConfigured")}</p>

          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setSchedule(emptySchedule())}
          >
            {t("configure")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedule.days.map((day, index) => (
            <fieldset
              key={day.dayOfWeek}
              disabled={pending}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(8rem,1fr)_2fr]"
            >
              <legend className="sr-only">
                {t(`days.${weekdays[index]}`)}
              </legend>

              <div className="flex items-center gap-3">
                <span className="min-w-24 font-semibold">
                  {t(`days.${weekdays[index]}`)}
                </span>

                <Checkbox
                  id={`hours-closed-${index}`}
                  checked={day.isClosed}
                  onCheckedChange={(checked) =>
                    updateDay(index, (current) => ({
                      ...current,
                      isClosed: checked === true,
                      windows:
                        checked === true
                          ? []
                          : current.windows.length
                            ? current.windows
                            : [{ start: "09:00", end: "17:00" }],
                    }))
                  }
                />

                <Label htmlFor={`hours-closed-${index}`}>{t("closed")}</Label>
              </div>

              {!day.isClosed && (
                <div className="grid gap-3">
                  {day.windows.map((window, windowIndex) => (
                    <div
                      key={`${index}-${windowIndex}`}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <div className="grid gap-1">
                        <Label htmlFor={`hours-start-${index}-${windowIndex}`}>
                          {t("opens")}
                        </Label>

                        <Input
                          id={`hours-start-${index}-${windowIndex}`}
                          type="time"
                          value={window.start}
                          onChange={(event) =>
                            updateDay(index, (current) => ({
                              ...current,
                              windows: current.windows.map((value, i) =>
                                i === windowIndex
                                  ? { ...value, start: event.target.value }
                                  : value
                              ),
                            }))
                          }
                        />
                      </div>

                      <div className="grid gap-1">
                        <Label htmlFor={`hours-end-${index}-${windowIndex}`}>
                          {t("closes")}
                        </Label>

                        <Input
                          id={`hours-end-${index}-${windowIndex}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          value={window.end}
                          onChange={(event) =>
                            updateDay(index, (current) => ({
                              ...current,
                              windows: current.windows.map((value, i) =>
                                i === windowIndex
                                  ? { ...value, end: event.target.value }
                                  : value
                              ),
                            }))
                          }
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        disabled={day.windows.length === 1}
                        onClick={() =>
                          updateDay(index, (current) => ({
                            ...current,
                            windows: current.windows.filter(
                              (_, i) => i !== windowIndex
                            ),
                          }))
                        }
                      >
                        {t("remove")}
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    disabled={day.windows.length >= 8}
                    onClick={() =>
                      updateDay(index, (current) => ({
                        ...current,
                        windows: [
                          ...current.windows,
                          { start: "14:00", end: "18:00" },
                        ],
                      }))
                    }
                  >
                    {t("addService")}
                  </Button>
                </div>
              )}
            </fieldset>
          ))}

          <OpeningHoursCopyPanel
            disabled={pending}
            schedule={schedule}
            onCopy={(next) => {
              setSchedule(next)
              setNotice(false)
              setError(null)
            }}
          />

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                {error === "conflict"
                  ? t("conflict")
                  : error === "invalid"
                    ? t("invalid")
                    : t("saveError")}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={pending || !dirty} onClick={save}>
              {t(pending ? "saving" : "save")}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={pending || !settings.openingHours}
              onClick={clear}
            >
              {t("clear")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              disabled={pending || !dirty}
              onClick={() => {
                setSchedule(settings.openingHours)
                setError(null)
                setNotice(false)
              }}
            >
              {t("cancel")}
            </Button>

            <span
              role="status"
              className="self-center text-sm text-muted-foreground"
            >
              {notice ? t("saved") : ""}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
