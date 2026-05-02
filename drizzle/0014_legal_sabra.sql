ALTER TYPE "public"."profile_bento_type" ADD VALUE 'map';--> statement-breakpoint
CREATE TABLE "profile_map_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"zoom" integer NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_map_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_map_bento" ADD CONSTRAINT "profile_map_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_map_bento_bento_id_idx" ON "profile_map_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE POLICY "profile_map_bento_public_select" ON "profile_map_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_map_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_map_bento_owner_insert" ON "profile_map_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_map_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_map_bento_owner_update" ON "profile_map_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_map_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_map_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_map_bento_owner_delete" ON "profile_map_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_map_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
REVOKE ALL ON TABLE "profile_map_bento" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "profile_map_bento" TO "anon", "authenticated";--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "profile_map_bento" TO "authenticated";
