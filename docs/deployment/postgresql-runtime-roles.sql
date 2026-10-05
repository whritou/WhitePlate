-- Operator-reviewed bootstrap for the NEW Coolify whiteplate database only.
-- No passwords and no login access are created by this script.
-- After review, set each password interactively with psql's \password command,
-- then enable LOGIN and verify positive access and cross-schema denial.
BEGIN;

DO $$
BEGIN
    IF current_database() <> 'whiteplate' THEN
        RAISE EXCEPTION 'Select the new Coolify whiteplate database before granting runtime access';
    END IF;
END $$;

CREATE ROLE whiteplate_api NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
CREATE ROLE whiteplate_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;

REVOKE ALL ON DATABASE whiteplate FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA auth FROM PUBLIC;

GRANT CONNECT ON DATABASE whiteplate TO whiteplate_api, whiteplate_auth;
GRANT USAGE ON SCHEMA public TO whiteplate_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO whiteplate_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO whiteplate_api;
REVOKE INSERT, UPDATE, DELETE ON public."__EFMigrationsHistory" FROM whiteplate_api;

GRANT USAGE ON SCHEMA auth TO whiteplate_auth;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO whiteplate_auth;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auth TO whiteplate_auth;

COMMIT;
