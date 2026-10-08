import {
  ArrowRight,
  Check,
  CircleCheck,
  Clock,
  CookingPot,
  ChevronDown,
  Network,
  ChartNoAxesCombined,
  Palette,
  CirclePlay,
  Smartphone,
  Star,
  Hand,
  BadgeCheck,
} from "lucide-react"

const icons = {
  arrow_forward: ArrowRight,
  check: Check,
  check_circle: CircleCheck,
  schedule: Clock,
  cooking: CookingPot,
  kitchen: CookingPot,
  expand_more: ChevronDown,
  hub: Network,
  insights: ChartNoAxesCombined,
  palette: Palette,
  play_circle: CirclePlay,
  smartphone: Smartphone,
  star: Star,
  touch_app: Hand,
  verified: BadgeCheck,
}

export function ReferenceIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = icons[name as keyof typeof icons] ?? CircleCheck

  return (
    <Icon
      aria-hidden="true"
      className={`inline-block size-5 shrink-0 ${className ?? ""}`}
    />
  )
}
