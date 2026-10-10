"use client"
import { Children, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Copy } from "@/components/lovable/copy"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
export function TeamDirectoryTabs({
  children,
  heading,
  action,
}: {
  children: ReactNode
  heading?: ReactNode
  action?: ReactNode
}) {
  const [summary, members, invitations, roles] = Children.toArray(children)
  const t = useTranslations("LiveParity")

  return (
    <div className="live-team-directory min-w-0">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-6">
        {heading}

        <div className="ml-auto flex max-w-full flex-wrap items-end gap-4">
          {summary}

          {action}
        </div>
      </header>

      <Tabs defaultValue="members" className="live-menu-builder">
        <TabsList
          className="h-auto w-full max-w-full flex-wrap border-b bg-background p-0"
          aria-label={t("staffTitle")}
        >
          <TabsTrigger value="members">
            <Copy>Members</Copy>
          </TabsTrigger>

          <TabsTrigger value="invites">
            <Copy>Invitations</Copy>
          </TabsTrigger>

          <TabsTrigger value="roles">
            <Copy>Roles & permissions</Copy>
          </TabsTrigger>

          <TabsTrigger value="activity">{t("activity")}</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="pt-6">
          {members}
        </TabsContent>

        <TabsContent keepMounted value="invites" className="pt-6">
          {invitations}
        </TabsContent>

        <TabsContent keepMounted value="roles" className="pt-6">
          {roles}
        </TabsContent>

        <TabsContent
          value="activity"
          className="p-6 text-sm text-muted-foreground"
        >
          {t("activityHelp")}
        </TabsContent>
      </Tabs>
    </div>
  )
}
