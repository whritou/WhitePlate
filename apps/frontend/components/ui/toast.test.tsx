import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import { Toast } from "@base-ui/react/toast"
import english from "@/messages/en.json"
import french from "@/messages/fr.json"
import { WorkspaceToastList } from "./toast"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      notifications: "Workspace notifications",
      dismiss: "Dismiss notification",
    })[key] ?? key,
}))

it("renders successful notices in a polite, labelled region with a named dismiss button", () => {
  const markup = renderToStaticMarkup(
    createElement(
      Toast.Provider,
      null,
      createElement(
        Toast.Viewport,
        {
          "aria-label": "Workspace notifications",
        },
        createElement(WorkspaceToastList, {
          toasts: [{ id: "toast-1", title: "Changes saved.", type: "success" }],
        })
      )
    )
  )

  expect(markup).toContain('aria-live="polite"')
  expect(markup).toContain('aria-label="Workspace notifications"')
  expect(markup).toContain("Changes saved.")
  expect(markup).toContain('aria-label="Dismiss notification"')
  expect(markup).toContain("Dismiss notification")
  expect(markup).toContain('type="button"')
})

it("provides matching translated notification and dismiss labels", () => {
  expect(english.WorkspaceToast).toEqual({
    notifications: "Workspace notifications",
    dismiss: "Dismiss notification",
  })
  expect(french.WorkspaceToast).toEqual({
    notifications: "Notifications de l’espace de travail",
    dismiss: "Fermer la notification",
  })
})
