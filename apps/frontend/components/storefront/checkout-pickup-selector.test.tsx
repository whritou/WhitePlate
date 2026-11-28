import { renderToStaticMarkup } from "react-dom/server"
import { NextIntlClientProvider } from "next-intl"
import { expect, it, vi } from "vitest"
import en from "@/messages/en.json"
import fr from "@/messages/fr.json"
import { CheckoutPickupSelector } from "./checkout-pickup-selector"

const slot = {
  startsAt: "2026-11-30T18:00:00Z",
  endsAt: "2026-11-30T18:15:00Z",
  remainingCapacity: 4,
  timeZone: "Europe/Paris",
}

function render(locale: "en" | "fr") {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "en" ? en : fr}
    >
      <CheckoutPickupSelector
        pickupSlots={[slot]}
        pickupSlotsLoading={false}
        pickupAvailabilityState="available"
        selectedPickupAt="asap"
        changePickupAt={vi.fn()}
      />
    </NextIntlClientProvider>
  )
}

it("formats pickup times in the app locale and restaurant time zone", () => {
  expect(render("fr")).toContain("lun. 30 nov., 19:00")
  expect(render("en")).toContain("Mon, Nov 30, 7:00")
})
