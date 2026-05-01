CREATE TYPE "public"."profile_media_type" AS ENUM('image', 'video');--> statement-breakpoint
ALTER TYPE "public"."profile_bento_type" ADD VALUE 'media';--> statement-breakpoint
CREATE TABLE "profile_media_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"mediaType" "profile_media_type" NOT NULL,
	"url" text NOT NULL,
	"objectKey" text NOT NULL,
	"href" text,
	"alt" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_media_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_media_bento" ADD CONSTRAINT "profile_media_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_media_bento_bento_id_idx" ON "profile_media_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE POLICY "profile_media_bento_public_select" ON "profile_media_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_media_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_media_bento_owner_insert" ON "profile_media_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_media_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_media_bento_owner_update" ON "profile_media_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_media_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_media_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_media_bento_owner_delete" ON "profile_media_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_media_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
REVOKE ALL ON TABLE "profile_media_bento" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "profile_media_bento" TO "anon", "authenticated";--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "profile_media_bento" TO "authenticated";
