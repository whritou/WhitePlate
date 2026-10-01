import { createStore } from "zustand/vanilla"
import type { StoreInitializer } from "@/types/state"

export function createStoreFactory<TInput, TState>(
  initializer: StoreInitializer<TInput, TState>
) {
  return (input: TInput) =>
    createStore<TState>()((set) => initializer(input, set))
}
