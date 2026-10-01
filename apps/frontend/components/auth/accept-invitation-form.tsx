"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { acceptStaffInvitationAction } from "@/actions/organization"
import { Button } from "@/components/ui/button"
import { ResultMessage } from "./result-message"
import type { ActionState } from "@/types/organization"

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
        className="h-11 rounded-lg"
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
