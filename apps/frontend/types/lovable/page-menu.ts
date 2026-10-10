import type { Tr } from "@/lib/lovable/menu"
export type Tab = "dishes" | "allergens" | "discounts" | "languages"
export type Translatable = { tr?: Tr } & Record<string, unknown>
