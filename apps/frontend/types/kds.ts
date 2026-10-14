export type OrderUrgency = "onTrack" | "dueSoon" | "overdue" | null

export type OrderTiming = {
  elapsedSeconds: number
  pickupRemainingSeconds: number | null
  urgency: OrderUrgency
}

export type KdsSoundState = "muted" | "enabled" | "unavailable"

export type KdsAudioContext = Pick<
  AudioContext,
  | "state"
  | "currentTime"
  | "destination"
  | "resume"
  | "suspend"
  | "close"
  | "createOscillator"
  | "createGain"
>
