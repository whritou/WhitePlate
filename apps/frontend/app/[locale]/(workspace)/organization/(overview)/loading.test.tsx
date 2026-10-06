import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import OrganizationLoading from "./loading"

const { getTranslations, labels } = vi.hoisted(() => ({
  getTranslations: vi.fn(),
  labels: { workspace: "Loading organization workspace…" },
}))

vi.mock("next-intl/server", () => ({ getTranslations }))

beforeEach(() => {
  vi.clearAllMocks()
  getTranslations.mockImplementation(
    async () => (key: string) => labels[key as "workspace"]
  )
})

it.each([
  "Loading organization workspace…",
  "Chargement de l’espace de travail…",
])("renders a localized, accessible route loading shell: %s", async (label) => {
  labels.workspace = label

  const loading = await OrganizationLoading()
  const html = renderToStaticMarkup(createElement(() => loading))

  expect(html).toContain('role="status"')
  expect(html).toContain(label)
  expect(html).toContain('aria-busy="true"')
  expect(html).toContain('aria-hidden="true"')
  expect(html).toContain("motion-reduce:animate-none")
  expect(html.indexOf('role="status"')).toBeLessThan(
    html.indexOf('aria-busy="true"')
  )
})
