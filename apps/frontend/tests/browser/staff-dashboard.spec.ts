import { expect, test } from "@playwright/test"
import {
  createAcceptanceOrder,
  localApi,
  staffFixture,
  transition,
} from "./staff-fixture"

test("staff roles, stale versions, revocation and tenant boundaries on the live dashboard", async ({
  browser,
}) => {
  test.setTimeout(180_000)

  const fixture = await staffFixture(browser)
  const { tenantId } = fixture.restaurant

  try {
    const order = await createAcceptanceOrder(fixture, "Role acceptance")
    const reference = order.id.slice(0, 8)
    const ownerPage = await fixture.owner.context.newPage()
    const managerPage = await fixture.manager.context.newPage()
    const kitchenPage = await fixture.kitchen.context.newPage()
    const foreignPage = await fixture.foreign.context.newPage()

    // Simulate disconnected live hints so this page retains its original version.
    await managerPage.route("**/hubs/orders**", (route) => route.abort())

    for (const [page, role] of [
      [ownerPage, "Owner"],
      [managerPage, "Manager"],
      [kitchenPage, "Kitchen staff"],
    ] as const) {
      await page.goto(`/en/organization/orders?tenantId=${tenantId}`)
      await expect(page.getByText(role, { exact: true })).toBeVisible()
      await expect(
        page.getByRole("heading", { name: `Order ${reference}`, exact: true })
      ).toBeVisible()
      await expect(
        page.getByRole("button", {
          name: `Start preparing — order ${reference}`,
          exact: true,
        })
      ).toBeVisible()
    }

    await expect(
      ownerPage.getByRole("button", {
        name: `Cancel order — order ${reference}`,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      managerPage.getByRole("button", {
        name: `Cancel order — order ${reference}`,
        exact: true,
      })
    ).toBeVisible()
    await expect(
      kitchenPage.getByRole("button", {
        name: `Cancel order — order ${reference}`,
        exact: true,
      })
    ).toHaveCount(0)

    const denied = await transition({
      request: fixture.kitchen.context.request,
      token: fixture.kitchen.token,
      tenantId,
      orderId: order.id,
      version: order.version,
      status: "Cancelled",
    })

    expect(denied.status()).toBe(403)
    await kitchenPage
      .getByRole("button", {
        name: `Start preparing — order ${reference}`,
        exact: true,
      })
      .click()
    await expect(
      kitchenPage
        .getByRole("status")
        .filter({ hasText: "Order status updated" })
    ).toBeVisible()

    const stale = await transition({
      request: fixture.manager.context.request,
      token: fixture.manager.token,
      tenantId,
      orderId: order.id,
      version: order.version,
      status: "Ready",
    })

    expect(stale.status()).toBe(412)
    // Keep the manager's original DOM snapshot while another identity advances the order.
    await managerPage
      .getByRole("button", {
        name: `Start preparing — order ${reference}`,
        exact: true,
      })
      .click()
    await expect(
      managerPage
        .getByRole("status")
        .filter({ hasText: "changed before your update" })
    ).toBeVisible()
    await expect(
      managerPage.getByRole("button", {
        name: `Mark ready — order ${reference}`,
        exact: true,
      })
    ).toBeVisible()
    await managerPage
      .getByRole("button", {
        name: `Mark ready — order ${reference}`,
        exact: true,
      })
      .click()
    await expect(
      managerPage.getByRole("button", {
        name: `Complete order — order ${reference}`,
        exact: true,
      })
    ).toBeVisible()

    const cancelledOrder = await createAcceptanceOrder(
      fixture,
      "Manager cancellation"
    )

    await managerPage.reload()
    await managerPage
      .getByRole("button", {
        name: `Cancel order — order ${cancelledOrder.id.slice(0, 8)}`,
        exact: true,
      })
      .click()
    await expect(
      managerPage
        .getByRole("status")
        .filter({ hasText: "Order status updated" })
    ).toBeVisible()
    await ownerPage.goto(`/fr/organization/orders?tenantId=${tenantId}`)
    await expect(
      ownerPage.getByText("Propriétaire", { exact: true })
    ).toBeVisible()
    await expect(
      ownerPage
        .locator("article")
        .filter({
          has: ownerPage.getByRole("heading", {
            name: `Commande ${cancelledOrder.id.slice(0, 8)}`,
            exact: true,
          }),
        })
        .getByText("Annulée", { exact: true })
    ).toBeVisible()

    await ownerPage
      .getByRole("button", {
        name: `Terminer la commande — commande ${reference}`,
        exact: true,
      })
      .click()
    await expect(
      ownerPage
        .getByRole("status")
        .filter({ hasText: "L’état de la commande a été modifié" })
    ).toBeVisible()
    await expect(
      ownerPage
        .locator("article")
        .filter({
          has: ownerPage.getByRole("heading", {
            name: `Commande ${reference}`,
            exact: true,
          }),
        })
        .getByText("Terminée", { exact: true })
    ).toBeVisible()

    await managerPage.goto(`/en/organization/catalog?tenantId=${tenantId}`)
    await expect(
      managerPage.getByRole("heading", { name: "Manage catalog", exact: true })
    ).toBeVisible()

    const managerCategory = managerPage.getByRole("form", {
      name: "New category",
      exact: true,
    })
    const managerCategoryName = `Manager category ${reference}`

    await managerCategory
      .getByLabel("Name", { exact: true })
      .fill(managerCategoryName)
    await managerCategory
      .getByRole("button", { name: "Create category", exact: true })
      .click()
    await expect(
      managerPage.getByRole("heading", {
        name: managerCategoryName,
        exact: true,
      })
    ).toBeVisible()
    await kitchenPage.goto(`/en/organization/catalog?tenantId=${tenantId}`)
    await expect(
      kitchenPage.getByRole("alert").filter({ hasText: "permission" })
    ).toBeVisible()
    await expect(kitchenPage.getByRole("form")).toHaveCount(0)

    const kitchenCatalog = await fixture.kitchen.context.request.post(
      `${localApi}/api/v1/tenants/${tenantId}/categories`,
      {
        headers: { Authorization: `Bearer ${fixture.kitchen.token}` },
        data: { name: "Denied kitchen category", sortOrder: 0 },
      }
    )

    expect([403, 404]).toContain(kitchenCatalog.status())
    await foreignPage.goto(`/en/organization/orders?tenantId=${tenantId}`)
    await expect(
      foreignPage.getByRole("heading", {
        name: "Orders unavailable",
        exact: true,
      })
    ).toBeVisible()
    await expect(foreignPage.locator("article")).toHaveCount(0)

    for (const resource of ["orders", "catalog"]) {
      const response = await fixture.foreign.context.request.get(
        `${localApi}/api/v1/tenants/${tenantId}/${resource}`,
        { headers: { Authorization: `Bearer ${fixture.foreign.token}` } }
      )

      expect([403, 404]).toContain(response.status())
    }

    const foreignWrite = await transition({
      request: fixture.foreign.context.request,
      token: fixture.foreign.token,
      tenantId,
      orderId: order.id,
      version: 3,
      status: "Completed",
    })

    expect(foreignWrite.status()).toBe(403)
    await foreignPage.goto(
      `/en/organization/orders?tenantId=${fixture.otherTenantId}`
    )
    await expect(
      foreignPage.getByRole("heading", { name: "Kitchen orders", exact: true })
    ).toBeVisible()
    await expect(
      foreignPage.getByText("Kitchen staff", { exact: true })
    ).toBeVisible()
    await managerPage.goto(
      `/en/organization/orders?tenantId=${fixture.otherTenantId}`
    )
    await expect(
      managerPage.getByRole("heading", {
        name: "Orders unavailable",
        exact: true,
      })
    ).toBeVisible()

    await kitchenPage.goto(
      `/en/organization/orders?tenantId=${tenantId}&status=Preparing`
    )
    await kitchenPage
      .getByRole("link", { name: "All orders", exact: true })
      .click()
    await expect(
      kitchenPage.getByRole("heading", {
        name: `Order ${reference}`,
        exact: true,
      })
    ).toBeVisible()
    await fixture.database.query(
      'DELETE FROM "RestaurantMemberships" WHERE "TenantId"=$1 AND "Subject"=$2 AND "Issuer"=$3',
      [tenantId, fixture.kitchen.id, "http://localhost:3000"]
    )
    await expect(
      kitchenPage
        .getByRole("alert")
        .filter({ hasText: "access to this restaurant" })
    ).toBeVisible({ timeout: 45_000 })
    await expect(kitchenPage.locator("article")).toHaveCount(0)
    await expect(
      kitchenPage.getByRole("navigation", {
        name: "Filter orders by status",
        exact: true,
      })
    ).toHaveCount(0)
    await kitchenPage.reload()
    await expect(
      kitchenPage.getByRole("heading", {
        name: "Orders unavailable",
        exact: true,
      })
    ).toBeVisible()
  } finally {
    await fixture.cleanup()
  }
})
