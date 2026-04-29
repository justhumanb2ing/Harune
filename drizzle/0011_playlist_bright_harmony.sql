CREATE TABLE "profile_playlist_item" (
	"id" text PRIMARY KEY NOT NULL,
	"profilePageId" text NOT NULL,
	"title" text NOT NULL,
	"provider" text NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL,
	"blockPosition" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "profile_playlist_item" ADD CONSTRAINT "profile_playlist_item_profilePageId_profile_page_id_fk" FOREIGN KEY ("profilePageId") REFERENCES "public"."profile_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_playlist_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_playlist_item_page_position_idx" ON "profile_playlist_item" USING btree ("profilePageId","position");--> statement-breakpoint
CREATE INDEX "profile_playlist_item_page_id_idx" ON "profile_playlist_item" USING btree ("profilePageId");--> statement-breakpoint
CREATE POLICY "profile_playlist_item_public_select" ON "profile_playlist_item" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_playlist_item"."profilePageId"
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_item_owner_insert" ON "profile_playlist_item" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_playlist_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_item_owner_update" ON "profile_playlist_item" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_playlist_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_playlist_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_item_owner_delete" ON "profile_playlist_item" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_playlist_item"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
REVOKE ALL ON TABLE "profile_playlist_item" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "profile_playlist_item" TO "anon", "authenticated";--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "profile_playlist_item" TO "authenticated";--> statement-breakpoint
