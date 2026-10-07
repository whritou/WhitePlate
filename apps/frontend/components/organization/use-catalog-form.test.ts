import type { FormEvent } from "react"
import { beforeEach, expect, it, vi } from "vitest"
import type { CatalogFormAction } from "@/types/catalog-management"
import { useCatalogForm } from "./use-catalog-form"

const mocks = vi.hoisted(() => ({
  setState: vi.fn(),
  refresh: vi.fn(),
  successToast: vi.fn(),
  transitionTask: Promise.resolve(),
}))

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>()

  return {
    ...actual,
    useRef: () => ({ current: false }),
    useState: (initial: unknown) => [initial, mocks.setState],
    useTransition: () => [
      false,
      (callback: () => void | Promise<void>) => {
        mocks.transitionTask = Promise.resolve(callback())
      },
    ],
  }
})

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({ saved: "Changes saved." })[key] ?? key,
}))

vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: mocks.successToast }),
}))

class TestFormData {
  constructor(readonly form: unknown) {}
}

it("locks the modal until the mutation settles and closes only on success", async () => {
  const events: string[] = []
  const { submit } = useCatalogForm(
    async () => ({ ok: true }),
    false,
    () => events.push("saved"),
    undefined,
    (pending) => events.push(pending ? "locked" : "unlocked")
  )

  submit({
    preventDefault() {},
    currentTarget: {},
  } as FormEvent<HTMLFormElement>)
  await mocks.transitionTask
  expect(events).toEqual(["locked", "saved", "unlocked"])
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.transitionTask = Promise.resolve()
  vi.stubGlobal("FormData", TestFormData as unknown as typeof FormData)
})

it("announces one generic success toast after a successful catalog mutation", async () => {
  const action = vi.fn<CatalogFormAction>().mockResolvedValue({ ok: true })
  const { submit } = useCatalogForm(action)
  const form = { reset: vi.fn() }
  const event = {
    preventDefault: vi.fn(),
    currentTarget: form,
  } as unknown as FormEvent<HTMLFormElement>

  submit(event)
  await mocks.transitionTask

  expect(mocks.successToast).toHaveBeenCalledTimes(1)
  expect(mocks.successToast).toHaveBeenCalledWith("Changes saved.")
  expect(mocks.refresh).toHaveBeenCalledOnce()
})

it("keeps catalog failures inline and does not announce success", async () => {
  const action = vi.fn<CatalogFormAction>().mockResolvedValue({
    ok: false,
    error: "unavailable",
  })
  const { submit } = useCatalogForm(action)
  const event = {
    preventDefault: vi.fn(),
    currentTarget: {},
  } as unknown as FormEvent<HTMLFormElement>

  submit(event)
  await mocks.transitionTask

  expect(mocks.successToast).not.toHaveBeenCalled()
  expect(mocks.setState).toHaveBeenLastCalledWith({
    status: "error",
    error: "unavailable",
  })
  expect(mocks.refresh).not.toHaveBeenCalled()
})
