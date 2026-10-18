"use client"

import { useState } from "react"
import { Menu } from "@base-ui/react/menu"
import { Archive, Eye, EyeOff, MoreHorizontal, Pencil, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { setCategoryVisibilityAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useVisualScope } from "@/components/ui/visual-scope"
import type { CatalogCategory } from "@/types/catalog-management"
import { ArchiveCatalogButton } from "../items/archive-catalog-button"
import { CategoryForm } from "../items/category-form"
import { useCatalogForm } from "../items/use-catalog-form"

export function MenuBuilderCategoryActions({
  category,
  tenantId,
  disabled,
  onPendingChange,
}: {
  category: CatalogCategory
  tenantId: string
  disabled: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const c = useTranslations("Catalog")
  const u = useTranslations("MenuBuilder")
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [visibilityOpen, setVisibilityOpen] = useState(false)
  const scope = useVisualScope()
  const VisibilityIcon = category.isVisible ? EyeOff : Eye

  return (
    <div data-no-drag="true" className="shrink-0">
      <Menu.Root>
        <Menu.Trigger
          disabled={disabled}
          aria-label={c("categoryActionsFor", { name: category.name })}
          data-no-drag="true"
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-12"
            />
          }
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Positioner
            side="right"
            align="start"
            sideOffset={4}
            className="z-50"
          >
            <Menu.Popup
              className={cn(
                "min-w-52 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
                scope.className
              )}
              style={scope.style}
            >
              <Menu.Item
                disabled={disabled}
                data-no-drag="true"
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                onClick={() => setArchiveOpen(true)}
              >
                <Archive
                  aria-hidden="true"
                  className="size-4 text-destructive"
                />

                {c("archive")}
              </Menu.Item>

              <Menu.Item
                disabled={disabled}
                data-no-drag="true"
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                onClick={() => setRenameOpen(true)}
              >
                <Pencil aria-hidden="true" className="size-4" />

                {c("renameCategory")}
              </Menu.Item>

              <Menu.Item
                disabled={disabled}
                data-no-drag="true"
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
                onClick={() => setVisibilityOpen(true)}
              >
                <VisibilityIcon aria-hidden="true" className="size-4" />

                {u(category.isVisible ? "hideCategory" : "showCategory")}
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <ArchiveCatalogButton
        tenantId={tenantId}
        id={category.id}
        entityType="categories"
        name={category.name}
        disabled={disabled}
        open={archiveOpen}
        hideTrigger
        onOpenChange={setArchiveOpen}
        onPendingChange={onPendingChange}
      />

      <CategoryVisibilityDialog
        category={category}
        tenantId={tenantId}
        open={visibilityOpen}
        onOpenChange={setVisibilityOpen}
        onPendingChange={onPendingChange}
      />

      <CategoryRenameDialog
        category={category}
        tenantId={tenantId}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onPendingChange={onPendingChange}
      />
    </div>
  )
}

function CategoryVisibilityDialog({
  category,
  tenantId,
  open,
  onOpenChange,
  onPendingChange,
}: {
  category: CatalogCategory
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    setCategoryVisibilityAction,
    false,
    () => onOpenChange(false),
    t("saved"),
    onPendingChange
  )
  const action = category.isVisible ? "hide" : "show"

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value && pending) return
        onOpenChange(value)
      }}
    >
      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>
              {t(`${action}CategoryDialogTitle`, { name: category.name })}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {t(`${action}CategoryDialogDescription`)}
            </AlertDialogDescription>
          </div>

          <form
            onSubmit={submit}
            aria-label={t("categoryActionsFor", { name: category.name })}
            className="grid gap-4"
          >
            <input type="hidden" name="tenantId" value={tenantId} />

            <input type="hidden" name="id" value={category.id} />

            <input
              type="hidden"
              name="isVisible"
              value={String(!category.isVisible)}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialogClose
                disabled={pending}
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                  />
                }
              >
                {t("cancel")}
              </AlertDialogClose>

              <Button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto"
              >
                {pending ? t("saving") : t(`${action}CategoryConfirm`)}
              </Button>
            </div>

            <ResultMessage
              state={state}
              hideSuccess
              message={t(`errors.${state.error ?? "unavailable"}`)}
            />
          </form>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}

function CategoryRenameDialog({
  category,
  tenantId,
  open,
  onOpenChange,
  onPendingChange,
}: {
  category: CatalogCategory
  tenantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const e = useTranslations("Editor")
  const [pending, setPending] = useState(false)

  return (
    <Dialog
      open={open}
      disablePointerDismissal
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value)
      }}
    >
      <DialogContent className="max-w-md" aria-busy={pending}>
        <header className="relative shrink-0 border-b border-border p-5 pr-16">
          <DialogTitle className="text-xl font-semibold break-words">
            {t("renameCategoryTitle", { name: category.name })}
          </DialogTitle>

          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            {t("renameCategoryDescription")}
          </DialogDescription>

          <DialogClose
            disabled={pending}
            aria-label={e("close")}
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3"
              />
            }
          >
            <X aria-hidden="true" />
          </DialogClose>
        </header>

        {open && (
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
            <CategoryForm
              tenantId={tenantId}
              category={category}
              onSuccess={() => onOpenChange(false)}
              onCancel={() => onOpenChange(false)}
              onPendingChange={(value) => {
                setPending(value)
                onPendingChange(value)
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
