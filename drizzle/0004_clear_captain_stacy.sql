ALTER TABLE "profile_social_link" ADD COLUMN "position" integer;--> statement-breakpoint

WITH ranked_social_links AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "profilePageId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) - 1 AS "position"
  FROM "profile_social_link"
)
UPDATE "profile_social_link"
SET "position" = ranked_social_links."position"
FROM ranked_social_links
WHERE "profile_social_link"."id" = ranked_social_links."id";--> statement-breakpoint

ALTER TABLE "profile_social_link" ALTER COLUMN "position" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_social_link_page_position_idx" ON "profile_social_link" USING btree ("profilePageId","position");
