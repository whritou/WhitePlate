import type { KdsAudioContext } from "@/types/kds"

export function createKdsSoundController(createContext: () => KdsAudioContext) {
  let context: KdsAudioContext | null = null
  let enabled = false

  return {
    async enable(): Promise<boolean> {
      try {
        context ??= createContext()
        await context.resume()
        enabled = context.state === "running"
      } catch {
        enabled = false
      }

      return enabled
    },
    mute() {
      enabled = false
      if (context?.state === "running")
        void context.suspend().catch(() => undefined)
    },
    alertNewOrder(): boolean {
      if (!enabled || context?.state !== "running") return false

      try {
        const startAt = context.currentTime + 0.01
        const oscillator = context.createOscillator()
        const gain = context.createGain()

        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(880, startAt)
        gain.gain.setValueAtTime(0.0001, startAt)
        gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.28)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(startAt)
        oscillator.stop(startAt + 0.3)

        return true
      } catch {
        return false
      }
    },
    dispose() {
      enabled = false
      if (context) void context.close().catch(() => undefined)
      context = null
    },
  }
}
