import { createStore } from "zustand/vanilla"
import type { StoreApi } from "zustand/vanilla"

export type StoreInitializer<TInput, TState> = (
  input: TInput,
  set: StoreApi<TState>["setState"]
) => TState

export function createStoreFactory<TInput, TState>(
  initializer: StoreInitializer<TInput, TState>
) {
  return (input: TInput) =>
    createStore<TState>()((set) => initializer(input, set))
}
