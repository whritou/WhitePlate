import { badgeVariants } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  orderEmailPlaceholderKeys,
  type OrderEmailPlaceholderKey,
} from "@/types/order-email-settings"

const placeholderTokenPattern = /\{\{\s*([A-Za-z][A-Za-z0-9]*)\s*\}\}/g
const placeholderKeySet = new Set<string>(orderEmailPlaceholderKeys)
const blockElementNames = new Set(["DIV", "P"])

export function renderTemplateValue(
  editor: HTMLDivElement,
  value: string,
  placeholderLabels: Record<OrderEmailPlaceholderKey, string>
) {
  editor.replaceChildren()

  let cursor = 0

  for (const match of value.matchAll(placeholderTokenPattern)) {
    const placeholder = match[1]

    if (!isPlaceholderKey(placeholder)) continue

    const tokenStart = match.index ?? 0

    if (tokenStart > cursor)
      editor.append(document.createTextNode(value.slice(cursor, tokenStart)))

    editor.append(createPlaceholderBadge(placeholder, placeholderLabels))
    cursor = tokenStart + match[0].length
  }

  if (cursor < value.length)
    editor.append(document.createTextNode(value.slice(cursor)))
}

export function serializeTemplateNodes(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ?? ""

  if (
    node.nodeType !== Node.ELEMENT_NODE &&
    node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
  )
    return ""

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement
    const placeholder = element.dataset.emailPlaceholder

    if (placeholder && isPlaceholderKey(placeholder))
      return `{{${placeholder}}}`

    if (element.tagName === "BR") return "\n"
  }

  return Array.from(node.childNodes)
    .map((child, index, nodes) => {
      const serialized = serializeTemplateNodes(child)

      if (
        child.nodeType === Node.ELEMENT_NODE &&
        blockElementNames.has((child as HTMLElement).tagName) &&
        index < nodes.length - 1
      )
        return `${serialized}\n`

      return serialized
    })
    .join("")
}

export function getPlaceholderImmediatelyBeforeCaret(
  editor: HTMLDivElement,
  range: Range
) {
  if (!range.collapsed || !editor.contains(range.startContainer)) return null

  const container = range.startContainer
  let previousNode: Node | null = null

  if (container.nodeType === Node.TEXT_NODE) {
    if (range.startOffset !== 0) return null

    previousNode = container.previousSibling
  } else if (container.nodeType === Node.ELEMENT_NODE) {
    previousNode = container.childNodes[range.startOffset - 1] ?? null
  }

  if (
    previousNode?.nodeType === Node.ELEMENT_NODE &&
    (previousNode as HTMLElement).dataset.emailPlaceholder
  )
    return previousNode as HTMLElement

  return null
}

export function truncateTemplateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value

  const tokenPattern = /\{\{[^}]*\}\}/g
  let result = ""
  let cursor = 0

  for (const match of value.matchAll(tokenPattern)) {
    const tokenStart = match.index ?? 0
    const plainText = value.slice(cursor, tokenStart)
    const remainingLength = maxLength - result.length

    if (plainText.length > remainingLength)
      return result + plainText.slice(0, remainingLength)

    result += plainText

    if (result.length + match[0].length > maxLength) return result

    result += match[0]
    cursor = tokenStart + match[0].length
  }

  return result + value.slice(cursor, cursor + maxLength - result.length)
}

export function createPlaceholderBadge(
  placeholder: OrderEmailPlaceholderKey,
  placeholderLabels: Record<OrderEmailPlaceholderKey, string>
) {
  const badge = document.createElement("span")

  badge.dataset.emailPlaceholder = placeholder
  badge.setAttribute("contenteditable", "false")
  badge.setAttribute("aria-label", placeholderLabels[placeholder])
  badge.title = placeholderLabels[placeholder]
  badge.className = cn(
    badgeVariants({ variant: "info" }),
    "mx-0.5 align-baseline select-none"
  )
  badge.textContent = placeholderLabels[placeholder]

  return badge
}

function isPlaceholderKey(value: string): value is OrderEmailPlaceholderKey {
  return placeholderKeySet.has(value)
}
