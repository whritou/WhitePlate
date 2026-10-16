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
  fetchThemePublication,
  publishTenantTheme,
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
  const publicationKey = [
    "theme-publication",
    props.userId,
    props.tenantId,
    locale,
  ]
  const publication = useQuery({
    queryKey: publicationKey,
    queryFn: ({ signal }) => fetchThemePublication(props.tenantId, signal),
    initialData: props.initialPublication,
    enabled: Boolean(query.data),
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
  const publishMutation = useMutation({
    mutationFn: (input: { draftVersion: number; publicationVersion: number }) =>
      publishTenantTheme(
        props.tenantId,
        input.draftVersion,
        input.publicationVersion
      ),
    retry: false,
    onSuccess: async (result) => {
      client.setQueryData(publicationKey, result)
      await Promise.all([
        client.invalidateQueries({
          queryKey: ["brand-assets", props.userId, props.tenantId, locale],
        }),
        client.invalidateQueries({ queryKey: publicationKey }),
      ])
    },
    onError: (error) => {
      if (error instanceof ThemeRequestError && error.code === "conflict") {
        void query.refetch()
        void publication.refetch()
      }
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
  const conflict = [mutation.error, publishMutation.error].some(
    (error) => error instanceof ThemeRequestError && error.code === "conflict"
  )
  const mutationDenied =
    mutation.error instanceof ThemeRequestError &&
    ["unauthorized", "forbidden", "not_found"].includes(mutation.error.code)
  const publicationDenied =
    publication.error instanceof ThemeRequestError &&
    ["unauthorized", "forbidden", "not_found"].includes(publication.error.code)
  const contrast = themeContrast(theme)
  const currentPublication = Boolean(
    query.data &&
    publication.data &&
    assets.data &&
    publication.data.sourceDraftVersion === query.data.version &&
    JSON.stringify(publication.data.theme) ===
      JSON.stringify(query.data.theme) &&
    publication.data.logoAssetId ===
      (assets.data.assets.find((asset) => asset.slot === "logo")?.id ?? null) &&
    publication.data.faviconAssetId ===
      (assets.data.assets.find((asset) => asset.slot === "favicon")?.id ??
        null) &&
    publication.data.bannerAssetId ===
      (assets.data.assets.find((asset) => asset.slot === "banner")?.id ?? null)
  )
  const bannerNeedsContrast = Boolean(
    assets.data?.assets.some((asset) => asset.slot === "banner") &&
    theme.bannerOverlay < 65
  )
  const canPublish = Boolean(
    query.data &&
    publication.data &&
    assets.data &&
    !query.isError &&
    !publication.isError &&
    !assets.isError &&
    !query.isFetching &&
    !publication.isFetching &&
    !assets.isFetching &&
    !draft &&
    !mutation.isPending &&
    !publishMutation.isPending &&
    !currentPublication &&
    contrast.readyForPublication &&
    !bannerNeedsContrast
  )
  const notice = query.isPending
    ? text("loading")
    : query.isError
      ? text("loadFailed")
      : publication.isError
        ? text("publicationLoadFailed")
        : conflict
          ? text("conflict")
          : publishMutation.isError
            ? text("publishFailed")
            : mutation.isError
              ? text("saveFailed")
              : publishMutation.isSuccess && currentPublication
                ? text("published")
                : !draft && currentPublication
                  ? text("published")
                  : !draft && bannerNeedsContrast
                    ? text("bannerOverlayWarning")
                    : !draft && !contrast.readyForPublication
                      ? text("contrastWarning", {
                          text: contrast.textOnBackground.toFixed(2),
                          primary: contrast.primaryOnBackground.toFixed(2),
                          accent: contrast.textOnAccent.toFixed(2),
                        })
                      : mutation.isSuccess && !draft
                        ? text("saved")
                        : draft
                          ? text("unsaved")
                          : text("draftNotice")

  function set(patch: Partial<StoreTheme>) {
    if (!source || pending.current || publishMutation.isPending || denied)
      return

    const appearance = themeAppearance({ ...theme, ...patch })

    setDraft({ theme: appearance, version: source.version })
    mutation.reset()
  }

  function saveDraft() {
    if (!draft || pending.current || denied || query.isError) return
    pending.current = true
    mutation.mutate(draft)
  }

  function publish() {
    if (!canPublish || !query.data || !publication.data) return
    publishMutation.mutate({
      draftVersion: query.data.version,
      publicationVersion: publication.data.version,
    })
  }

  function reload() {
    setDraft(null)
    mutation.reset()
    publishMutation.reset()
    void query.refetch()
    void publication.refetch()
  }

  return {
    theme,
    set,
    saveDraft,
    publish,
    discard: reload,
    saved: !draft,
    locked:
      !query.data ||
      query.isError ||
      query.isFetching ||
      mutation.isPending ||
      publishMutation.isPending,
    saving: mutation.isPending,
    publishing: publishMutation.isPending,
    canPublish,
    notice,
    logoPreset: palette.data?.palette ?? undefined,
    hidden: denied || mutationDenied || publicationDenied,
    canReload:
      query.isError ||
      publication.isError ||
      mutation.isError ||
      publishMutation.isError,
    reload,
  }
}
