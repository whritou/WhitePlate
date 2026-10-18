"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { OpeningHoursSchedule } from "@/types/establishment-settings"

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

export function OpeningHoursCopyPanel({
  disabled,
  schedule,
  onCopy,
}: {
  disabled: boolean
  schedule: OpeningHoursSchedule
  onCopy: (schedule: OpeningHoursSchedule) => void
}) {
  const t = useTranslations("OpeningHours")
  const [sourceDay, setSourceDay] = useState(0)
  const [targetDays, setTargetDays] = useState<number[]>([])

  function apply() {
    if (!targetDays.length) return

    const names = targetDays
      .map((index) => t(`days.${weekdays[index]}`))
      .join(", ")

    if (!window.confirm(t("copyConfirm", { days: names }))) return

    const source = schedule.days[sourceDay]

    onCopy({
      ...schedule,
      days: schedule.days.map((day, index) =>
        targetDays.includes(index)
          ? {
              ...day,
              isClosed: source.isClosed,
              windows: source.windows.map((window) => ({ ...window })),
            }
          : day
      ),
    })
    setTargetDays([])
  }

  return (
    <div
      className="grid gap-3 rounded-lg border p-4"
      aria-label={t("copyTitle")}
    >
      <h3 className="font-semibold">{t("copyTitle")}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="hours-copy-source">{t("copySource")}</Label>

          <NativeSelect
            id="hours-copy-source"
            value={sourceDay}
            onChange={(event) => setSourceDay(Number(event.target.value))}
          >
            {weekdays.map((day, index) => (
              <NativeSelectOption key={day} value={index}>
                {t(`days.${day}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">{t("copyTargets")}</legend>

          {weekdays.map(
            (day, index) =>
              index !== sourceDay && (
                <div
                  key={day}
                  className="flex min-h-11 items-center gap-3 text-sm"
                >
                  <Checkbox
                    id={`hours-copy-target-${index}`}
                    checked={targetDays.includes(index)}
                    onCheckedChange={(checked) =>
                      setTargetDays((current) =>
                        checked === true
                          ? [...current, index]
                          : current.filter((target) => target !== index)
                      )
                    }
                  />

                  <Label htmlFor={`hours-copy-target-${index}`}>
                    {t(`days.${day}`)}
                  </Label>
                </div>
              )
          )}
        </fieldset>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={!targetDays.length || disabled}
        onClick={apply}
      >
        {t("copyApply")}
      </Button>
    </div>
  )
}
