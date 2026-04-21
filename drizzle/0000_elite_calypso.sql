CREATE TABLE IF NOT EXISTS "profile_page" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL,
  "handle" text NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "profile_page_userId_app_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."app_user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_page_handle_idx" ON "profile_page" USING btree ("handle");
CREATE INDEX IF NOT EXISTS "profile_page_user_id_idx" ON "profile_page" USING btree ("userId");

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_user'
      AND column_name = 'handle'
  ) THEN
    INSERT INTO "profile_page" ("id", "userId", "handle", "createdAt", "updatedAt")
    SELECT
      'page_' || "app_user"."id",
      "app_user"."id",
      "app_user"."handle",
      COALESCE("app_user"."createdAt", now()),
      now()
    FROM "app_user"
    WHERE "app_user"."handle" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "profile_page"
        WHERE "profile_page"."handle" = "app_user"."handle"
      );
  END IF;
END $$;

DROP INDEX IF EXISTS "app_user_handle_idx";

ALTER TABLE "app_user" DROP COLUMN IF EXISTS "handle";
ALTER TABLE "app_user" DROP COLUMN IF EXISTS "onboardingCompleted";
