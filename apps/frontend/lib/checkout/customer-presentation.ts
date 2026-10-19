import { photoUrl } from "@/lib/product-photos"
import { cartItemKey } from "./cart"
import { DEFAULT_MENU } from "@/lib/lovable/menu"
import type { Product, StorefrontMenu } from "@/types/storefront"
import type { CartItem } from "@/types/checkout"
import type { MenuData } from "@/types/lovable/menu"
import type { CartDraft } from "@/types/lovable/customerOrder"

const sourceAllergenAliases: Record<string, string> = {
  cerealsWithGluten: "gluten",
  eggs: "egg",
  soybeans: "soy",
  peanuts: "nuts",
}

function allergenIcon(code: string) {
  return (
    DEFAULT_MENU.allergens.find(
      (allergen) => allergen.id === (sourceAllergenAliases[code] ?? code)
    )?.icon ?? "⚠"
  )
}

/** Presentation only; guest checkout keeps authority over prices and selections. */
export function customerMenu(
  menu: StorefrontMenu,
  restaurantSlug?: string,
  label: (key: string, values?: Record<string, number>) => string = (key) => key
): MenuData {
  return {
    languages: menu.availableLocales,
    allergens: [
      ...new Set(
        menu.categories.flatMap((category) =>
          category.products.flatMap(
            (product) => product.containsAllergens ?? []
          )
        )
      ),
    ].map((code) => ({
      id: code,
      name: label(`allergenNames.${code}`),
      icon: allergenIcon(code),
    })),
    discounts: [],
    categories: menu.categories.map((category) => ({
      id: category.id,
      cat: category.name,
      items: category.products.map((product) => ({
        id: product.id,
        n: product.name,
        d: product.description ?? "",
        p: product.basePrice,
        available: product.isAvailable,
        allergens: product.containsAllergens,
        tag: product.dietaryTags?.[0]
          ? label(`dietaryNames.${product.dietaryTags[0]}`)
          : undefined,
        details: foodDetails(product, menu.locale, label),
        images: (product.photos ?? []).flatMap((photo) => {
          const url = photoUrl(
            product.id,
            photo.id,
            640,
            undefined,
            restaurantSlug
          )

          return url ? [url] : []
        }),
        options: product.optionGroups.map((group) => ({
          group: group.name,
          type: group.maximumSelections === 1 ? "one" : "many",
          minimumSelections: group.minimumSelections,
          maximumSelections: group.maximumSelections,
          choices: group.options.map((option) => ({
            id: option.id,
            n: option.name,
            p: option.priceAdjustment,
          })),
        })),
      })),
    })),
  }
}

export function customerCart(
  menu: MenuData,
  cart: CartItem[],
  code: string,
  lang: string
): CartDraft {
  const products = menu.categories.flatMap((category) => category.items)

  return {
    code,
    lang,
    lines: cart.flatMap((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId
      )

      if (!product) return []

      const choices = product.options
        .flatMap((group) => group.choices)
        .filter((choice) => choice.id && item.optionIds.includes(choice.id))

      return [
        {
          key: cartItemKey(item),
          product,
          qty: item.quantity,
          unit: product.p + choices.reduce((sum, choice) => sum + choice.p, 0),
          picks: choices.map((choice) => choice.n),
        },
      ]
    }),
  }
}

function foodDetails(
  product: Product,
  locale: string,
  label: (key: string, values?: Record<string, number>) => string
) {
  return [
    ...(product.mayContainAllergens?.length
      ? [
          `${label("mayContainAllergens")}: ${product.mayContainAllergens.map((code) => label(`allergenNames.${code}`)).join(", ")}`,
        ]
      : []),
    ...(product.dietaryTags ?? []).map((code) => label(`dietaryNames.${code}`)),
    ...((product.containsAllergens?.length ?? 0) +
      (product.mayContainAllergens?.length ?? 0) >
    0
      ? [label("allergenDisclaimer")]
      : []),
    ...(product.preparationMinutes != null
      ? [
          label("preparationEstimate", {
            minutes: product.preparationMinutes,
          }),
        ]
      : []),
    ...(product.preparationNotes?.[locale]
      ? [product.preparationNotes[locale]]
      : []),
  ]
}
