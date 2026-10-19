import type {
  OpeningHoursSchedule,
  PublicEstablishment,
} from "@/types/establishment-settings"

export function customerAddressLines(
  establishment: PublicEstablishment,
  locale: string
) {
  const countries = new Intl.DisplayNames([locale], { type: "region" })

  return [
    establishment.addressLine1,
    establishment.addressLine2,
    [establishment.postalCode, establishment.city].filter(Boolean).join(" "),
    establishment.region,
    establishment.countryCode ? countries.of(establishment.countryCode) : null,
  ].filter(Boolean)
}

export function summarizeHours(
  schedule: OpeningHoursSchedule | null,
  locale: string,
  closedLabel: string,
  notConfiguredLabel: string
) {
  if (!schedule) return notConfiguredLabel

  const groups: { days: string[]; hours: string }[] = []

  schedule.days.forEach((day, index) => {
    const weekday = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(2024, 0, index + 1)))
    const hours = day.isClosed
      ? closedLabel
      : day.windows.map((window) => `${window.start}–${window.end}`).join(", ")
    const previous = groups.at(-1)

    if (previous?.hours === hours) previous.days.push(weekday)
    else groups.push({ days: [weekday], hours })
  })

  return groups
    .map(({ days, hours }) => {
      const dayRange = days.length > 1 ? `${days[0]}–${days.at(-1)}` : days[0]

      return `${dayRange} · ${hours}`
    })
    .join("\n")
}
