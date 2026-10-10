"use client"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { StorefrontMenu } from "@/types/storefront"
import type { GuestCheckoutController } from "@/types/checkout"
export function LiveStoreActions({
  menu,
  checkoutState,
  count,
  amount,
  checkoutView,
}: {
  menu: StorefrontMenu
  checkoutState: GuestCheckoutController
  count: number
  amount: string
  checkoutView: boolean
}) {
  const t = useTranslations("Storefront")
  const router = useRouter()

  return (
    <div className="flex max-w-full flex-wrap items-center gap-2">
      {menu.availableLocales.length > 1 && (
        <NativeSelect
          aria-label={t("menuLanguage")}
          value={menu.locale}
          disabled={checkoutState.locked}
          className="w-auto"
          selectClassName="max-w-24 text-sm font-bold uppercase"
          onChange={(event) =>
            checkoutState.startLanguageChange(() =>
              router.replace(
                { pathname: "/", query: { menuLocale: event.target.value } },
                { scroll: false }
              )
            )
          }
        >
          {menu.availableLocales.map((language) => (
            <NativeSelectOption key={language} value={language} lang={language}>
              {language.toUpperCase()}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}

      {!checkoutView && (
        <DialogTrigger
          disabled={checkoutState.locked}
          render={<Button size="sm" />}
        >
          <span>{t("viewCart", { count })}</span>

          <span className="tabular-nums">{amount}</span>
        </DialogTrigger>
      )}
    </div>
  )
}
