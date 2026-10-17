import { isRecord } from "@/lib/validation/common"
import type {
  OrderEmailLocaleTemplates,
  OrderEmailSettings,
  OrderEmailTemplate,
} from "@/types/order-email-settings"

const placeholders = new Set([
  "customerName",
  "restaurantName",
  "orderNumber",
  "orderSummary",
  "pickupTime",
  "pickupInstructions",
  "trackingUrl",
])

export function parseOrderEmailSettings(
  input: unknown
): OrderEmailSettings | null {
  if (
    !isRecord(input) ||
    !Number.isSafeInteger(input.version) ||
    Number(input.version) < 1 ||
    typeof input.defaultLocale !== "string" ||
    !Array.isArray(input.locales) ||
    !input.locales.every((locale) => typeof locale === "string") ||
    !Array.isArray(input.templates) ||
    !Array.isArray(input.defaults)
  )
    return null

  const templates = input.templates.map(parseLocaleTemplates)
  const defaults = input.defaults.map(parseLocaleTemplates)

  if (
    templates.some((template) => template === null) ||
    templates.length !== input.locales.length ||
    defaults.some((template) => template === null) ||
    defaults.length !== input.locales.length
  )
    return null

  return {
    version: Number(input.version),
    defaultLocale: input.defaultLocale,
    locales: [...input.locales],
    templates: templates as OrderEmailLocaleTemplates[],
    defaults: defaults as OrderEmailLocaleTemplates[],
  }
}

export function parseOrderEmailTemplates(
  input: unknown
): OrderEmailLocaleTemplates[] | null {
  if (!Array.isArray(input)) return null

  const templates = input.map(parseLocaleTemplates)

  return templates.every((template) => template !== null)
    ? (templates as OrderEmailLocaleTemplates[])
    : null
}

function parseLocaleTemplates(
  input: unknown
): OrderEmailLocaleTemplates | null {
  if (
    !isRecord(input) ||
    typeof input.locale !== "string" ||
    input.locale.length < 2 ||
    input.locale.length > 128
  )
    return null

  const orderCreated = parseTemplate(input.orderCreated)
  const preparing = parseTemplate(input.preparing)
  const ready = parseTemplate(input.ready)

  return orderCreated && preparing && ready
    ? { locale: input.locale, orderCreated, preparing, ready }
    : null
}

function parseTemplate(input: unknown): OrderEmailTemplate | null {
  if (
    !isRecord(input) ||
    !validTemplateText(input.subject, 120, true) ||
    !validTemplateText(input.heading, 120, true) ||
    !validTemplateText(input.body, 2000, false)
  )
    return null

  return {
    subject: input.subject,
    heading: input.heading,
    body: input.body,
  }
}

function validTemplateText(
  input: unknown,
  maxLength: number,
  singleLine: boolean
): input is string {
  if (
    typeof input !== "string" ||
    !input.trim() ||
    input.length > maxLength ||
    input.includes("<") ||
    input.includes(">") ||
    (singleLine && /[\r\n]/.test(input))
  )
    return false

  const matches = [...input.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)]
  const remaining = input.replace(/\{\{\s*[^}]+?\s*\}\}/g, "")

  return (
    matches.every((match) => placeholders.has(match[1])) &&
    !remaining.includes("{{") &&
    !remaining.includes("}}")
  )
}
