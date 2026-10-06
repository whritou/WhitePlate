import "server-only"

import { whitePlateApi } from "@/lib/api"
import {
  parseCatalog,
  parseMenuLanguageSettings,
  parseOrganizations,
  parseOrganizationInvitations,
  parseOrganizationMembers,
  parseRestaurants,
} from "@/lib/validation/responses"
import type { ApiResult } from "@/types/api"

async function readResource<T>(
  path: string,
  parse: (data: unknown) => T | null
): Promise<ApiResult<T>> {
  const response = await whitePlateApi.get<unknown>(path)

  if (!response.ok) return response

  const data = parse(response.data)

  return data === null
    ? { ok: false, status: 502, error: "unavailable" }
    : { ok: true, status: 200, data }
}

export async function getOrganizations() {
  return readResource("/api/v1/organizations", parseOrganizations)
}

export async function getOrganizationRestaurants(organizationId: string) {
  return readResource(
    `/api/v1/organizations/${organizationId}/restaurants`,
    parseRestaurants
  )
}

export async function getOrganizationMembers(organizationId: string) {
  return readResource(
    `/api/v1/organizations/${organizationId}/members`,
    parseOrganizationMembers
  )
}

export async function getOrganizationInvitations(organizationId: string) {
  return readResource(
    `/api/v1/organizations/${organizationId}/invitations`,
    parseOrganizationInvitations
  )
}

export async function getMenuLanguageSettings(tenantId: string) {
  return readResource(
    `/api/v1/tenants/${tenantId}/menu-languages`,
    parseMenuLanguageSettings
  )
}

export async function getCatalog(tenantId: string) {
  return readResource(`/api/v1/tenants/${tenantId}/catalog`, parseCatalog)
}
