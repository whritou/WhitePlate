export type Tr = Record<string, Record<string, string>>
export type Choice = { n: string; p: number; tr?: Tr }
export type Option = {
  group: string
  type: "one" | "many"
  choices: Choice[]
  tr?: Tr
}
export type Product = {
  id: string
  n: string
  d: string
  p: number
  images: string[]
  tag?: string | undefined
  options: Option[]
  available?: boolean
  tax?: number
  allergens?: string[]
  tr?: Tr
}
export type Category = { id: string; cat: string; items: Product[]; tr?: Tr }
export type Allergen = { id: string; name: string; icon: string; tr?: Tr }
export type Discount = {
  id: string
  code: string
  type: "percent" | "fixed"
  value: number
  min: number
  expires: string
  active: boolean
}
export type MenuData = {
  languages: string[]
  categories: Category[]
  allergens: Allergen[]
  discounts: Discount[]
}
