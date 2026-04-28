CREATE TABLE "jwks" (
	"id" text PRIMARY KEY NOT NULL,
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "jwks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_link_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_page" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_social_link" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_text_box_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "profile_link_item_public_select" ON "profile_link_item" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_link_item"."profilePageId"
  ));--> statement-breakpoint
CREATE POLICY "profile_link_item_owner_insert" ON "profile_link_item" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_link_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_link_item_owner_update" ON "profile_link_item" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_link_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_link_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_link_item_owner_delete" ON "profile_link_item" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_link_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_page_public_select" ON "profile_page" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "profile_page_owner_insert" ON "profile_page" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (nullif(auth.jwt() ->> 'sub', '') = "profile_page"."userId");--> statement-breakpoint
CREATE POLICY "profile_page_owner_update" ON "profile_page" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (nullif(auth.jwt() ->> 'sub', '') = "profile_page"."userId") WITH CHECK (nullif(auth.jwt() ->> 'sub', '') = "profile_page"."userId");--> statement-breakpoint
CREATE POLICY "profile_page_owner_delete" ON "profile_page" AS PERMISSIVE FOR DELETE TO "authenticated" USING (nullif(auth.jwt() ->> 'sub', '') = "profile_page"."userId");--> statement-breakpoint
CREATE POLICY "profile_social_link_public_select" ON "profile_social_link" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_social_link"."profilePageId"
  ));--> statement-breakpoint
CREATE POLICY "profile_social_link_owner_insert" ON "profile_social_link" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_social_link"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_social_link_owner_update" ON "profile_social_link" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_social_link"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_social_link"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_social_link_owner_delete" ON "profile_social_link" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_social_link"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_box_item_public_select" ON "profile_text_box_item" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_text_box_item"."profilePageId"
  ));--> statement-breakpoint
CREATE POLICY "profile_text_box_item_owner_insert" ON "profile_text_box_item" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_text_box_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_box_item_owner_update" ON "profile_text_box_item" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_text_box_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_text_box_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_box_item_owner_delete" ON "profile_text_box_item" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_text_box_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "plans_public_select" ON "plans" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
REVOKE ALL ON TABLE "auth_account", "auth_session", "auth_verification", "app_user", "jwks", "credit_transactions", "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item", "plans" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item", "plans" TO "anon", "authenticated";--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item" TO "authenticated";--> statement-breakpoint
DO $$
BEGIN
  IF to_regclass('public.coupon') IS NOT NULL THEN
    ALTER TABLE "coupon" ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE "coupon" FROM "anon", "authenticated";
  END IF;
END $$;
