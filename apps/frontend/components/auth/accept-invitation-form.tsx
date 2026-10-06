"use client"

import { acceptStaffInvitationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import type { ActionState } from "@/types/organization"
import { ArrowRight, LoaderCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { ResultMessage } from "./result-message"

export function AcceptInvitationForm({ token }: { token: string }) {
  const t = useTranslations("Auth")
  const [state, setState] = useState<ActionState>({ status: "idle" })

  async function accept() {
    setState({ status: "pending" })

    const result = await acceptStaffInvitationAction(token).catch(() => ({
      ok: false as const,
      message: "unavailable" as const,
    }))

    if (result.ok) {
      setState({ status: "success" })
    } else setState({ status: "error", error: result.message })
  }

  return (
    <div className="grid gap-4">
      <ResultMessage
        state={state}
        message={
          state.status === "success"
            ? t("invitationAccepted")
            : state.error === "unauthorized"
              ? t("sessionRequired")
              : state.error === "invalid"
                ? t("invalidInvitation")
                : t("serviceError")
        }
      />

      <Button
        type="button"
        onClick={() => void accept()}
        disabled={state.status === "pending"}
      >
        {state.status === "pending" ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <>
            {t("acceptInvitationAction")}

            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </div>
  )
}
