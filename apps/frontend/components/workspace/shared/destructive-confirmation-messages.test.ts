import { expect, it } from "vitest"
import english from "@/messages/en.json"
import french from "@/messages/fr.json"

const catalogs = [english.Catalog, french.Catalog]

it("provides localized titles and pending labels for destructive confirmations", () => {
  for (const catalog of catalogs) {
    expect(catalog.archiveDialogTitle).toContain("{name}")
    expect(catalog.deactivateDialogTitle).toContain("{code}")
    expect(catalog.archiving).toBeTruthy()
    expect(catalog.deactivating).toBeTruthy()
  }
})

it("keeps catalog cascade and order-history consequences in confirmation copy", () => {
  for (const catalog of catalogs) {
    expect(catalog.confirmCategoryArchive).toBeTruthy()
    expect(catalog.confirmProductArchive).toBeTruthy()
    expect(catalog.confirmOptionGroupArchive).toBeTruthy()
    expect(catalog.confirmOptionArchive).toBeTruthy()
    expect(catalog.confirmDiscountDeactivation).toBeTruthy()
  }
})
