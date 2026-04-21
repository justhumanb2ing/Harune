ALTER TABLE "profile_page" ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE "profile_page" ADD COLUMN IF NOT EXISTS "bio" text;
ALTER TABLE "profile_page" ADD COLUMN IF NOT EXISTS "image" text;
ALTER TABLE "profile_page" ADD COLUMN IF NOT EXISTS "socialLinks" jsonb DEFAULT '{}'::jsonb NOT NULL;
