ALTER TABLE "profile_page" ADD COLUMN "linkBlockPosition" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_text_box_item" ADD COLUMN "blockPosition" integer;--> statement-breakpoint
UPDATE "profile_text_box_item" SET "blockPosition" = "position" + 1 WHERE "blockPosition" IS NULL;--> statement-breakpoint
ALTER TABLE "profile_text_box_item" ALTER COLUMN "blockPosition" SET NOT NULL;
