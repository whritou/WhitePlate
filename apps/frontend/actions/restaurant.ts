"use server"

import { parseRestaurantInput } from "@/lib/validation/restaurant"
import { createRestaurant } from "@/services/restaurant"
import type { RestaurantResult } from "@/types/restaurant"

export async function createRestaurantAction(
  input: unknown
): Promise<RestaurantResult> {
  const value = parseRestaurantInput(input)

  return value ? createRestaurant(value) : { ok: false, message: "invalid" }
}
