CREATE TYPE "public"."profile_bento_breakpoint" AS ENUM('desktop', 'compact');--> statement-breakpoint
CREATE TYPE "public"."profile_bento_type" AS ENUM('link', 'text', 'playlist', 'section');--> statement-breakpoint
CREATE TABLE "profile_bento_layout" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"breakpoint" "profile_bento_breakpoint" NOT NULL,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"w" integer NOT NULL,
	"h" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_bento_layout" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"profilePageId" text NOT NULL,
	"type" "profile_bento_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_link_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"favicon" text,
	"thumbnail" text,
	"url" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_link_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_playlist_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"title" text NOT NULL,
	"provider" text NOT NULL,
	"url" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_playlist_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_section_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_section_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profile_text_bento" (
	"id" text PRIMARY KEY NOT NULL,
	"bentoId" text NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile_text_bento" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profile_bento_layout" ADD CONSTRAINT "profile_bento_layout_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_bento" ADD CONSTRAINT "profile_bento_profilePageId_profile_page_id_fk" FOREIGN KEY ("profilePageId") REFERENCES "public"."profile_page"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_link_bento" ADD CONSTRAINT "profile_link_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_playlist_bento" ADD CONSTRAINT "profile_playlist_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_section_bento" ADD CONSTRAINT "profile_section_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_text_bento" ADD CONSTRAINT "profile_text_bento_bentoId_profile_bento_id_fk" FOREIGN KEY ("bentoId") REFERENCES "public"."profile_bento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_bento_layout_bento_breakpoint_idx" ON "profile_bento_layout" USING btree ("bentoId","breakpoint");--> statement-breakpoint
CREATE INDEX "profile_bento_layout_bento_id_idx" ON "profile_bento_layout" USING btree ("bentoId");--> statement-breakpoint
CREATE INDEX "profile_bento_page_id_idx" ON "profile_bento" USING btree ("profilePageId");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_link_bento_bento_id_idx" ON "profile_link_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_playlist_bento_bento_id_idx" ON "profile_playlist_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_section_bento_bento_id_idx" ON "profile_section_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_text_bento_bento_id_idx" ON "profile_text_bento" USING btree ("bentoId");--> statement-breakpoint
CREATE POLICY "profile_bento_layout_public_select" ON "profile_bento_layout" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_bento_layout"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_layout_owner_insert" ON "profile_bento_layout" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_bento_layout"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_layout_owner_update" ON "profile_bento_layout" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_bento_layout"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_bento_layout"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_layout_owner_delete" ON "profile_bento_layout" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_bento_layout"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_public_select" ON "profile_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_bento"."profilePageId"
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_owner_insert" ON "profile_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_bento"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_owner_update" ON "profile_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_bento"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_bento"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_bento_owner_delete" ON "profile_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = "profile_bento"."profilePageId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_link_bento_public_select" ON "profile_link_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_link_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_link_bento_owner_insert" ON "profile_link_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_link_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_link_bento_owner_update" ON "profile_link_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_link_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_link_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_link_bento_owner_delete" ON "profile_link_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_link_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_bento_public_select" ON "profile_playlist_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_playlist_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_bento_owner_insert" ON "profile_playlist_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_playlist_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_bento_owner_update" ON "profile_playlist_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_playlist_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_playlist_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_playlist_bento_owner_delete" ON "profile_playlist_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_playlist_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_section_bento_public_select" ON "profile_section_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_section_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_section_bento_owner_insert" ON "profile_section_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_section_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_section_bento_owner_update" ON "profile_section_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_section_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_section_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_section_bento_owner_delete" ON "profile_section_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_section_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_bento_public_select" ON "profile_text_bento" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_text_bento"."bentoId"
  ));--> statement-breakpoint
CREATE POLICY "profile_text_bento_owner_insert" ON "profile_text_bento" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_text_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_bento_owner_update" ON "profile_text_bento" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_text_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  )) WITH CHECK (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_text_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
CREATE POLICY "profile_text_bento_owner_delete" ON "profile_text_bento" AS PERMISSIVE FOR DELETE TO "authenticated" USING (exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = "profile_text_bento"."bentoId"
      and "profile_page"."userId" = nullif(auth.jwt() ->> 'sub', '')
  ));--> statement-breakpoint
REVOKE ALL ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" TO "anon", "authenticated";--> statement-breakpoint
GRANT INSERT, UPDATE, DELETE ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" TO "authenticated";
