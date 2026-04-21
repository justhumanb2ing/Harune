DO $$
BEGIN
  CREATE TYPE "profile_social_platform" AS ENUM ('x', 'instagram', 'youtube', 'linkedin', 'github');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "profile_social_link" (
  "id" text PRIMARY KEY NOT NULL,
  "profilePageId" text NOT NULL,
  "platform" "profile_social_platform" NOT NULL,
  "url" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_social_link_profilePageId_profile_page_id_fk" FOREIGN KEY ("profilePageId") REFERENCES "public"."profile_page"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "profile_link_item" (
  "id" text PRIMARY KEY NOT NULL,
  "profilePageId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "url" text NOT NULL,
  "position" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_link_item_profilePageId_profile_page_id_fk" FOREIGN KEY ("profilePageId") REFERENCES "public"."profile_page"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "profile_text_box_item" (
  "id" text PRIMARY KEY NOT NULL,
  "profilePageId" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "position" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_text_box_item_profilePageId_profile_page_id_fk" FOREIGN KEY ("profilePageId") REFERENCES "public"."profile_page"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_social_link_page_platform_idx" ON "profile_social_link" USING btree ("profilePageId", "platform");
CREATE INDEX IF NOT EXISTS "profile_social_link_page_id_idx" ON "profile_social_link" USING btree ("profilePageId");

CREATE UNIQUE INDEX IF NOT EXISTS "profile_link_item_page_position_idx" ON "profile_link_item" USING btree ("profilePageId", "position");
CREATE INDEX IF NOT EXISTS "profile_link_item_page_id_idx" ON "profile_link_item" USING btree ("profilePageId");

CREATE UNIQUE INDEX IF NOT EXISTS "profile_text_box_item_page_position_idx" ON "profile_text_box_item" USING btree ("profilePageId", "position");
CREATE INDEX IF NOT EXISTS "profile_text_box_item_page_id_idx" ON "profile_text_box_item" USING btree ("profilePageId");

INSERT INTO "profile_social_link" ("id", "profilePageId", "platform", "url", "createdAt", "updatedAt")
SELECT
  "profile_page"."id" || '_social_' || "social_item"."key",
  "profile_page"."id",
  "social_item"."key"::"profile_social_platform",
  "social_item"."value",
  now(),
  now()
FROM "profile_page"
CROSS JOIN LATERAL jsonb_each_text(COALESCE("profile_page"."socialLinks", '{}'::jsonb)) AS "social_item"("key", "value")
WHERE "social_item"."key" IN ('x', 'instagram', 'youtube', 'linkedin', 'github')
  AND NULLIF(trim("social_item"."value"), '') IS NOT NULL
ON CONFLICT ("profilePageId", "platform")
DO UPDATE SET
  "url" = EXCLUDED."url",
  "updatedAt" = now();

ALTER TABLE "profile_page" DROP COLUMN IF EXISTS "socialLinks";
