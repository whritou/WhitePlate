"use client"

export const RESTAURANTS = [
  "All restaurants",
  "Bastille",
  "Oberkampf",
  "Batignolles",
]
export const RANGES = [
  ["7", "7 days"],
  ["30", "30 days"],
  ["90", "90 days"],
] as const
export const DISHES = [
  "Burger Maison",
  "Green bowl",
  "Roast chicken",
  "Wild mushroom risotto",
  "Burrata",
  "Tiramisu",
  "Lemon tart",
  "Courgette flowers",
]
export const PRICES = [17, 14, 19, 16, 11, 7, 7, 9]
export const C = {
  primary: "var(--primary)",
  accent: "var(--accent)",
  ink: "var(--foreground)",
  muted: "#6b7570",
  grid: "rgba(0,0,0,.08)",
}
export function useThemeColors() {}

export function rng(seed: number) {
  let s = seed

  return () => (s = (s * 9301 + 49297) % 233280) / 233280
}

export function build(days: number, rIdx: number) {
  const r = rng(days * 7 + rIdx * 131 + 3)
  const scale = rIdx === 0 ? 1 : [0, 0.45, 0.3, 0.25][rIdx]!
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date()

    d.setDate(d.getDate() - (days - 1 - i))

    const weekend = [5, 6].includes(d.getDay())
      ? 1.35
      : d.getDay() === 0
        ? 0.5
        : 1
    const orders = Math.round((60 + r() * 30 + i * 0.25) * weekend * scale)
    const basket = 26 + r() * 8
    const prev = Math.round(orders * (0.8 + r() * 0.2) * basket)

    return {
      day: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      orders,
      revenue: Math.round(orders * basket),
      prev,
    }
  })
  const hours = Array.from({ length: 13 }, (_, i) => {
    const h = 11 + i
    const peak =
      h === 12 || h === 13
        ? 1
        : h === 19 || h === 20
          ? 0.95
          : h === 21
            ? 0.6
            : h < 12 || (h > 14 && h < 18)
              ? 0.12
              : 0.35

    return {
      hour: `${h}h`,
      orders: Math.round(peak * (40 + r() * 12) * scale * (days / 7)),
    }
  })
  const dishes = DISHES.map((n, i) => {
    const q = Math.round((300 - i * 28 + r() * 60) * scale * (days / 30))

    return { n, q, rev: q * PRICES[i]! }
  }).sort((a, b) => b.rev - a.rev)
  const channels = [
    { name: "Web", value: 58 },
    { name: "QR code", value: 27 },
    { name: "Phone", value: 15 },
  ]

  return { series, hours, dishes, channels, r }
}

export const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`
export const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0)
