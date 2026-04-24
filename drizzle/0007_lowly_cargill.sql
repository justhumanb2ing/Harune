DROP TABLE IF EXISTS "invitation" CASCADE;
DROP TABLE IF EXISTS "member" CASCADE;
DROP TABLE IF EXISTS "organization" CASCADE;
DROP TYPE IF EXISTS "public"."invitation_status";
DROP TYPE IF EXISTS "public"."organization_role";
ALTER TABLE "auth_session" DROP COLUMN "activeOrganizationId";
