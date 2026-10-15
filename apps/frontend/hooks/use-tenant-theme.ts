"use client"
import { useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DEFAULT_THEME } from "@/lib/lovable/storeTheme"
import { fetchBrandAssets } from "@/lib/api/brand-browser"
import {
  fetchThemeDraft,
  fetchThemePalette,
  saveTenantTheme,
  ThemeRequestError,
} from "@/lib/api/theme-browser"
import {
  themeAppearance,
  themeContrast,
} from "@/lib/validation/theme-appearance"
import type { StoreTheme } from "@/types/lovable/storeTheme"
import type {
  LiveStudioProps,
  StudioController,
  ThemeDraft,
} from "@/types/theme"

export function useTenantTheme(
  props: LiveStudioProps
): StudioController & { hidden: boolean; reload: () => void } {
  const locale = useLocale()
  const text = useTranslations("ThemeStudio")
  const client = useQueryClient()
  const key = ["tenant-theme", props.userId, props.tenantId, locale]
  const [draft, setDraft] = useState<ThemeDraft | null>(null)
  const pending = useRef(false)
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchThemeDraft(props.tenantId, signal),
    initialData: props.initialTheme,
    retry: false,
    staleTime: 15_000,
  })
  const denied =
    query.error instanceof ThemeRequestError &&
    ["unauthorized", "forbidden", "not_found"].includes(query.error.code)
  const assets = useQuery({
    queryKey: ["brand-assets", props.userId, props.tenantId, locale],
    queryFn: ({ signal }) => fetchBrandAssets(props.tenantId, signal),
    initialData: props.initialData,
    enabled: Boolean(query.data) && !denied,
    retry: false,
    staleTime: 15_000,
  })
  const logoId =
    assets.data?.assets.find((asset) => asset.slot === "logo")?.id ?? "none"
  const palette = useQuery({
    queryKey: [...key, "palette", logoId],
    queryFn: ({ signal }) => fetchThemePalette(props.tenantId, signal),
    enabled: Boolean(query.data) && !denied,
    retry: false,
    staleTime: 15_000,
  })
  const mutation = useMutation({
    mutationFn: (value: ThemeDraft) =>
      saveTenantTheme(props.tenantId, value.theme, value.version),
    retry: false,
    onSuccess: (result) => {
      client.setQueryData(key, result)
      setDraft(null)
    },
    onError: (error) => {
      if (
        error instanceof ThemeRequestError &&
        ["unauthorized", "forbidden", "not_found", "conflict"].includes(
          error.code
        )
      )
        void query.refetch()
    },
    onSettled: () => {
      pending.current = false
    },
  })
  const source = draft ?? query.data
  const assetUrl = (slot: string) => {
    const asset = assets.data?.assets.find((value) => value.slot === slot)

    return asset
      ? `/api/brand-assets?${new URLSearchParams({ tenantId: props.tenantId, assetId: asset.id })}`
      : ""
  }

  const theme = {
    ...DEFAULT_THEME,
    ...source?.theme,
    name: props.restaurantName,
    tagline: "",
    address: "",
    phone: "",
    hours: "",
    prepTime: "",
    logo: assetUrl("logo"),
    banner: assetUrl("banner"),
    favicon: assetUrl("favicon"),
    domain: "",
    domainStatus: "none" as const,
  }
  const conflict =
    mutation.error instanceof ThemeRequestError &&
    mutation.error.code === "conflict"
  const mutationDenied =
    mutation.error instanceof ThemeRequestError &&
    ["unauthorized", "forbidden", "not_found"].includes(mutation.error.code)
  const contrast = themeContrast(theme)
  const notice = query.isPending
    ? text("loading")
    : query.isError
      ? text("loadFailed")
      : conflict
        ? text("conflict")
        : mutation.isError
          ? text("saveFailed")
          : mutation.isSuccess && !draft
            ? text("saved")
            : !contrast.readyForPublication
              ? text("contrastWarning", {
                  text: contrast.textOnBackground.toFixed(2),
                  primary: contrast.primaryOnBackground.toFixed(2),
                  accent: contrast.textOnAccent.toFixed(2),
                })
              : text("draftNotice")

  function set(patch: Partial<StoreTheme>) {
    if (!source || pending.current || denied) return

    const appearance = themeAppearance({ ...theme, ...patch })

    setDraft({ theme: appearance, version: source.version })
    mutation.reset()
  }

  function publish() {
    if (!draft || pending.current || denied || query.isError) return
    pending.current = true
    mutation.mutate(draft)
  }

  function reload() {
    setDraft(null)
    mutation.reset()
    void query.refetch()
  }

  return {
    theme,
    set,
    publish,
    saved: !draft,
    locked: !query.data || query.isError || mutation.isPending,
    saving: mutation.isPending,
    notice,
    logoPreset: palette.data?.palette ?? undefined,
    hidden: denied || mutationDenied,
    canReload: query.isError || mutation.isError,
    reload,
  }
}
