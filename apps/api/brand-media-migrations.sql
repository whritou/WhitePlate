CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260928213141_InitialTenants') THEN
    CREATE TABLE "Tenants" (
        "Id" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Subdomain" character varying(63) NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_Tenants" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260928213141_InitialTenants') THEN
    CREATE UNIQUE INDEX "IX_Tenants_Subdomain" ON "Tenants" ("Subdomain");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260928213141_InitialTenants') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260928213141_InitialTenants', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    CREATE TABLE "Organizations" (
        "Id" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_Organizations" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    INSERT INTO "Organizations" ("Id", "Name", "IsActive")
    SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'Migrated restaurants', TRUE
    WHERE EXISTS (SELECT 1 FROM "Tenants");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    ALTER TABLE "Tenants" ADD "Currency" character varying(3) NOT NULL DEFAULT 'EUR';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    ALTER TABLE "Tenants" ADD "OrganizationId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    CREATE INDEX "IX_Tenants_OrganizationId" ON "Tenants" ("OrganizationId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    ALTER TABLE "Tenants" ADD CONSTRAINT "FK_Tenants_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929101956_OrganizationAndTenantOwnership') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929101956_OrganizationAndTenantOwnership', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    DROP INDEX "IX_Tenants_OrganizationId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    ALTER TABLE "Tenants" ADD CONSTRAINT "AK_Tenants_OrganizationId_Id" UNIQUE ("OrganizationId", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    CREATE TABLE "OrganizationOwnerMemberships" (
        "OrganizationId" uuid NOT NULL,
        "Issuer" character varying(500) NOT NULL,
        "Subject" character varying(200) NOT NULL,
        CONSTRAINT "PK_OrganizationOwnerMemberships" PRIMARY KEY ("OrganizationId", "Issuer", "Subject"),
        CONSTRAINT "FK_OrganizationOwnerMemberships_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    CREATE TABLE "RestaurantMemberships" (
        "TenantId" uuid NOT NULL,
        "Issuer" character varying(500) NOT NULL,
        "Subject" character varying(200) NOT NULL,
        "Role" character varying(32) NOT NULL,
        CONSTRAINT "PK_RestaurantMemberships" PRIMARY KEY ("TenantId", "Issuer", "Subject"),
        CONSTRAINT "FK_RestaurantMemberships_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    CREATE TABLE "StaffInvitations" (
        "Id" uuid NOT NULL,
        "OrganizationId" uuid NOT NULL,
        "TenantId" uuid,
        "Role" character varying(32) NOT NULL,
        "TokenHash" character varying(64) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "IsRevoked" boolean NOT NULL,
        "AcceptedIssuer" character varying(500),
        "AcceptedSubject" character varying(200),
        CONSTRAINT "PK_StaffInvitations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_StaffInvitations_Organizations_OrganizationId" FOREIGN KEY ("OrganizationId") REFERENCES "Organizations" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_StaffInvitations_Tenants_OrganizationId_TenantId" FOREIGN KEY ("OrganizationId", "TenantId") REFERENCES "Tenants" ("OrganizationId", "Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    CREATE INDEX "IX_StaffInvitations_OrganizationId_TenantId" ON "StaffInvitations" ("OrganizationId", "TenantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    CREATE UNIQUE INDEX "IX_StaffInvitations_TokenHash" ON "StaffInvitations" ("TokenHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929105422_StaffMembershipsAndInvitations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929105422_StaffMembershipsAndInvitations', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "MenuCategories" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "SortOrder" integer NOT NULL,
        "IsArchived" boolean NOT NULL,
        CONSTRAINT "PK_MenuCategories" PRIMARY KEY ("Id"),
        CONSTRAINT "AK_MenuCategories_TenantId_Id" UNIQUE ("TenantId", "Id"),
        CONSTRAINT "FK_MenuCategories_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "Orders" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "Currency" character varying(3) NOT NULL,
        "CustomerName" character varying(160) NOT NULL,
        "DiscountCode" character varying(32),
        "Subtotal" numeric(12,2) NOT NULL,
        "DiscountAmount" numeric(12,2) NOT NULL,
        "TaxAmount" numeric(12,2) NOT NULL,
        "Total" numeric(12,2) NOT NULL,
        "Status" character varying(16) NOT NULL,
        "Version" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Orders" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "PromotionDiscounts" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "Code" character varying(32) NOT NULL,
        "Name" character varying(120) NOT NULL,
        "Kind" character varying(32) NOT NULL,
        "Value" numeric(12,2) NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_PromotionDiscounts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PromotionDiscounts_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "Products" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "CategoryId" uuid NOT NULL,
        "Name" character varying(160) NOT NULL,
        "Description" character varying(1000),
        "BasePrice" numeric(12,2) NOT NULL,
        "TaxRatePercent" numeric(5,2) NOT NULL,
        "SortOrder" integer NOT NULL,
        "IsAvailable" boolean NOT NULL,
        "IsArchived" boolean NOT NULL,
        CONSTRAINT "PK_Products" PRIMARY KEY ("Id"),
        CONSTRAINT "AK_Products_TenantId_Id" UNIQUE ("TenantId", "Id"),
        CONSTRAINT "FK_Products_MenuCategories_TenantId_CategoryId" FOREIGN KEY ("TenantId", "CategoryId") REFERENCES "MenuCategories" ("TenantId", "Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "OrderLines" (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "ProductName" character varying(160) NOT NULL,
        "BaseUnitPrice" numeric(12,2) NOT NULL,
        "TaxRatePercent" numeric(5,2) NOT NULL,
        "Quantity" integer NOT NULL,
        "Subtotal" numeric(12,2) NOT NULL,
        "DiscountAmount" numeric(12,2) NOT NULL,
        "TaxAmount" numeric(12,2) NOT NULL,
        "Total" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_OrderLines" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrderLines_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "ProductOptionGroups" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "MinimumSelections" integer NOT NULL,
        "MaximumSelections" integer NOT NULL,
        "SortOrder" integer NOT NULL,
        "IsArchived" boolean NOT NULL,
        CONSTRAINT "PK_ProductOptionGroups" PRIMARY KEY ("Id"),
        CONSTRAINT "AK_ProductOptionGroups_TenantId_Id" UNIQUE ("TenantId", "Id"),
        CONSTRAINT "FK_ProductOptionGroups_Products_TenantId_ProductId" FOREIGN KEY ("TenantId", "ProductId") REFERENCES "Products" ("TenantId", "Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "OrderLineOptions" (
        "Id" uuid NOT NULL,
        "OrderLineId" uuid NOT NULL,
        "OptionId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "PriceAdjustment" numeric(12,2) NOT NULL,
        CONSTRAINT "PK_OrderLineOptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrderLineOptions_OrderLines_OrderLineId" FOREIGN KEY ("OrderLineId") REFERENCES "OrderLines" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE TABLE "ProductOptions" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "GroupId" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "PriceAdjustment" numeric(12,2) NOT NULL,
        "SortOrder" integer NOT NULL,
        "IsArchived" boolean NOT NULL,
        CONSTRAINT "PK_ProductOptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_ProductOptions_ProductOptionGroups_TenantId_GroupId" FOREIGN KEY ("TenantId", "GroupId") REFERENCES "ProductOptionGroups" ("TenantId", "Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_MenuCategories_TenantId_SortOrder_Id" ON "MenuCategories" ("TenantId", "SortOrder", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_OrderLineOptions_OrderLineId" ON "OrderLineOptions" ("OrderLineId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_OrderLines_OrderId" ON "OrderLines" ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_Orders_TenantId_CreatedAt_Id" ON "Orders" ("TenantId", "CreatedAt", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_ProductOptionGroups_TenantId_ProductId" ON "ProductOptionGroups" ("TenantId", "ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_ProductOptions_TenantId_GroupId" ON "ProductOptions" ("TenantId", "GroupId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE INDEX "IX_Products_TenantId_CategoryId_SortOrder_Id" ON "Products" ("TenantId", "CategoryId", "SortOrder", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    CREATE UNIQUE INDEX "IX_PromotionDiscounts_TenantId_Code" ON "PromotionDiscounts" ("TenantId", "Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929112432_OrderSnapshots') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929112432_OrderSnapshots', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    ALTER TABLE "Orders" ADD "CreatedAtTicks" bigint;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    UPDATE "Orders" SET "CreatedAtTicks" = (EXTRACT(EPOCH FROM "CreatedAt") * 10000000 + 621355968000000000)::bigint;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    ALTER TABLE "Orders" ALTER COLUMN "CreatedAtTicks" SET NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE TABLE "OrderIdempotencyRecords" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "KeyHash" character varying(64) NOT NULL,
        "RequestHash" character varying(64) NOT NULL,
        "ResponseJson" text NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_OrderIdempotencyRecords" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE TABLE "OrderOutboxMessages" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "EventType" character varying(64) NOT NULL,
        "PayloadJson" text NOT NULL,
        "OccurredAt" timestamp with time zone NOT NULL,
        "AvailableAt" timestamp with time zone NOT NULL,
        "LeaseUntil" timestamp with time zone,
        "LeaseVersion" integer NOT NULL,
        "Attempts" integer NOT NULL,
        "DispatchedAt" timestamp with time zone,
        CONSTRAINT "PK_OrderOutboxMessages" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_OrderOutboxMessages_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE INDEX "IX_Orders_TenantId_CreatedAtTicks_Id" ON "Orders" ("TenantId", "CreatedAtTicks", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE INDEX "IX_OrderIdempotencyRecords_ExpiresAt" ON "OrderIdempotencyRecords" ("ExpiresAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE UNIQUE INDEX "IX_OrderIdempotencyRecords_TenantId_KeyHash" ON "OrderIdempotencyRecords" ("TenantId", "KeyHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE INDEX "IX_OrderOutboxMessages_DispatchedAt_AvailableAt_LeaseUntil" ON "OrderOutboxMessages" ("DispatchedAt", "AvailableAt", "LeaseUntil");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    CREATE INDEX "IX_OrderOutboxMessages_TenantId_OccurredAt_Id" ON "OrderOutboxMessages" ("TenantId", "OccurredAt", "Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929122902_OrderCheckoutOutbox') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929122902_OrderCheckoutOutbox', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929123238_IdempotencyTenantOwnership') THEN
    ALTER TABLE "OrderIdempotencyRecords" ADD CONSTRAINT "FK_OrderIdempotencyRecords_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929123238_IdempotencyTenantOwnership') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929123238_IdempotencyTenantOwnership', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929153627_StaffInvitationRecipientEmail') THEN
    ALTER TABLE "StaffInvitations" ADD "RecipientEmail" character varying(254);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260929153627_StaffInvitationRecipientEmail') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260929153627_StaffInvitationRecipientEmail', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "Tenants" ADD "DefaultMenuLocale" character varying(128) NOT NULL DEFAULT 'en';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "Tenants" ADD "MenuLocalesJson" text NOT NULL DEFAULT '["en"]';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "Products" ADD "TranslationsJson" text NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "ProductOptions" ADD "TranslationsJson" text NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "ProductOptionGroups" ADD "TranslationsJson" text NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    ALTER TABLE "MenuCategories" ADD "TranslationsJson" text NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260930160026_CatalogLocalization') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260930160026_CatalogLocalization', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261002090808_LocalizedOrderSnapshots') THEN
    ALTER TABLE "Orders" ADD "MenuLocale" character varying(128);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261002090808_LocalizedOrderSnapshots') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261002090808_LocalizedOrderSnapshots', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    ALTER TABLE "Orders" ADD "ArchivedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    ALTER TABLE "Orders" ADD "ClosedAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    ALTER TABLE "Orders" ADD "ClosedAtTicks" bigint;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    UPDATE "Orders"
    SET "ClosedAt" = "CreatedAt", "ClosedAtTicks" = "CreatedAtTicks"
    WHERE "Status" IN ('Completed', 'Cancelled');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    CREATE INDEX "IX_Orders_Status_ClosedAtTicks_ArchivedAt" ON "Orders" ("Status", "ClosedAtTicks", "ArchivedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261007102252_DailyOrderHistory') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261007102252_DailyOrderHistory', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008084937_PublicOrderTracking') THEN
    ALTER TABLE "Orders" ADD "TrackingTokenExpiresAt" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008084937_PublicOrderTracking') THEN
    ALTER TABLE "Orders" ADD "TrackingTokenHash" character varying(64);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008084937_PublicOrderTracking') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261008084937_PublicOrderTracking', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008094652_RestaurantDescriptionTranslations') THEN
    ALTER TABLE "Tenants" ADD "DescriptionTranslationsJson" text NOT NULL DEFAULT '{}';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008094652_RestaurantDescriptionTranslations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261008094652_RestaurantDescriptionTranslations', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008195344_CategoryVisibility') THEN
    ALTER TABLE "MenuCategories" ADD "IsVisible" boolean NOT NULL DEFAULT TRUE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008195344_CategoryVisibility') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261008195344_CategoryVisibility', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008205518_BrandMediaAssets') THEN
    CREATE TABLE "MediaAssets" (
        "Id" uuid NOT NULL,
        "TenantId" uuid NOT NULL,
        "Slot" character varying(16) NOT NULL,
        "ContentType" character varying(32) NOT NULL,
        "ObjectKey" character varying(128) NOT NULL,
        "Width" integer NOT NULL,
        "Height" integer NOT NULL,
        "Bytes" bigint NOT NULL,
        "IsReady" boolean NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ExpiresAt" timestamp with time zone,
        CONSTRAINT "PK_MediaAssets" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_MediaAssets_Tenants_TenantId" FOREIGN KEY ("TenantId") REFERENCES "Tenants" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008205518_BrandMediaAssets') THEN
    CREATE INDEX "IX_MediaAssets_ExpiresAt" ON "MediaAssets" ("ExpiresAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008205518_BrandMediaAssets') THEN
    CREATE UNIQUE INDEX "IX_MediaAssets_ObjectKey" ON "MediaAssets" ("ObjectKey");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008205518_BrandMediaAssets') THEN
    CREATE UNIQUE INDEX "IX_MediaAssets_TenantId_Slot" ON "MediaAssets" ("TenantId", "Slot") WHERE "IsActive" = true;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008205518_BrandMediaAssets') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261008205518_BrandMediaAssets', '10.0.12');
    END IF;
END $EF$;
COMMIT;

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008210000_BrandMediaPublicationState') THEN
    ALTER TABLE "MediaAssets" ADD "WasPublished" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261008210000_BrandMediaPublicationState') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261008210000_BrandMediaPublicationState', '10.0.12');
    END IF;
END $EF$;
COMMIT;

