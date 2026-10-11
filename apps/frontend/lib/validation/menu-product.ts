import { isRecord } from "./common"

const allergens = [
  "celery",
  "cerealsWithGluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soybeans",
  "sulphites",
]
const diets = ["dairyFree", "glutenFree", "pescatarian", "vegan", "vegetarian"]

export function isMenuProductMetadata(value: Record<string, unknown>): boolean {
  const isAllowed = (items: unknown, supported: string[]) =>
    items === undefined ||
    (Array.isArray(items) &&
      items.every((code) => supported.includes(code as string)))

  return (
    isAllowed(value.containsAllergens, allergens) &&
    isAllowed(value.mayContainAllergens, allergens) &&
    isAllowed(value.dietaryTags, diets) &&
    (value.preparationMinutes === undefined ||
      value.preparationMinutes === null ||
      (Number.isInteger(value.preparationMinutes) &&
        (value.preparationMinutes as number) >= 1 &&
        (value.preparationMinutes as number) <= 1440)) &&
    (value.preparationNotes === undefined ||
      (isRecord(value.preparationNotes) &&
        Object.values(value.preparationNotes).every(
          (note) => typeof note === "string" && note.length <= 250
        )))
  )
}
