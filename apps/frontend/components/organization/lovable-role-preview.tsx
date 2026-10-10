"use client"
import { Check, Minus } from "lucide-react"
import { Copy } from "@/components/lovable/copy"
import { PERMS, SEED } from "@/components/lovable/pages/staff-shared"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { MissingFeatureNotice } from "./missing-feature-notice"

export function LovableRolePreview() {
  return (
    <section className="min-w-0 border">
      <header className="border-b p-5">
        <h2 className="font-display text-xl font-bold">
          <Copy>Roles & permissions</Copy>
        </h2>
      </header>

      <div className="p-5">
        <MissingFeatureNotice />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead>
              <Copy>Permission</Copy>
            </TableHead>

            {SEED.roles.map((role) => (
              <TableHead key={role.id}>
                <Copy>{role.name}</Copy>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {PERMS.map(([permission, label]) => (
            <TableRow key={permission}>
              <TableCell>
                <Copy>{label}</Copy>
              </TableCell>

              {SEED.roles.map((role) => (
                <TableCell key={role.id}>
                  <span
                    role="img"
                    aria-label={role.perms.includes(permission) ? "✓" : "—"}
                  >
                    {role.perms.includes(permission) ? (
                      <Check
                        size={16}
                        className="text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <Minus
                        size={16}
                        className="text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
