import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { handleSchema } from "@/lib/validations/auth.schema";
import { z } from "zod";

const emptyStringToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};

const requiredText = (field: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required.`)
    .max(maxLength, `${field} must be ${maxLength} characters or fewer.`);

const optionalNullableText = (maxLength: number) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().max(maxLength, `Must be ${maxLength} characters or fewer.`).nullable()
  );

const nullableUrl = z.preprocess(
  emptyStringToNull,
  z.string().url("Enter a valid URL.").nullable()
);

export const socialPlatformSchema = z.enum([
  "x",
  "instagram",
  "youtube",
  "linkedin",
  "github",
  "threads",
  "soundcloud",
  "spotify",
  "behance",
  "tiktok",
  "mail",
  "apple_music",
]);

export const profilePageUpdateSchema = z.object({
  handle: handleSchema,
  name: requiredText("Name", 100),
  bio: optionalNullableText(280),
  image: nullableUrl,
});

export const socialLinkInputSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().trim().max(2048, "Must be 2048 characters or fewer."),
});

const entityIdSchema = z.string().trim().min(1, "Entity id is required.");

export const linkItemInputSchema = z.object({
  title: requiredText("Title", 100),
  description: optionalNullableText(280),
  favicon: optionalNullableText(2048),
  url: z.string().trim().url("Enter a valid URL."),
});

export const textBoxItemInputSchema = z.object({
  title: requiredText("Title", 100),
  description: optionalNullableText(1000),
});

export const reorderItemsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1, "At least one item is required."),
});

export const profilePageSyncSocialLinkSchema = z.object({
  platform: socialPlatformSchema,
  position: z.number().int().nonnegative(),
  url: z.string().trim().max(2048, "Must be 2048 characters or fewer."),
});

export const profilePageSyncLinkItemSchema = z.object({
  id: entityIdSchema,
  title: requiredText("Title", 100),
  description: z.string().trim().max(280, "Must be 280 characters or fewer."),
  favicon: z.string().trim().max(2048, "Must be 2048 characters or fewer."),
  position: z.number().int().nonnegative(),
  url: z.string().trim().url("Enter a valid URL."),
});

export const profilePageSyncTextBoxItemSchema = z.object({
  id: entityIdSchema,
  title: requiredText("Title", 100),
  description: z.string().trim().max(1000, "Must be 1000 characters or fewer."),
  position: z.number().int().nonnegative(),
  blockPosition: z.number().int().nonnegative(),
});

export const profilePageSyncSchema = z
  .object({
    page: z.object({
      handle: handleSchema,
      linkBlockPosition: z.number().int().nonnegative(),
      name: requiredText("Name", 100),
      bio: z.string().trim().max(280, "Must be 280 characters or fewer."),
      image: nullableUrl,
    }),
    socialLinks: z
      .array(profilePageSyncSocialLinkSchema)
      .max(MAX_SOCIAL_LINKS, `You can add up to ${MAX_SOCIAL_LINKS} social links.`),
    linkItems: z.array(profilePageSyncLinkItemSchema),
    textBoxItems: z.array(profilePageSyncTextBoxItemSchema),
  })
  .superRefine((value, ctx) => {
    const socialPlatforms = new Set<string>();
    const socialPositions = new Set<number>();

    for (const [index, socialLink] of value.socialLinks.entries()) {
      if (socialPlatforms.has(socialLink.platform)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate social platforms are not allowed.",
          path: ["socialLinks", index, "platform"],
        });
      }

      socialPlatforms.add(socialLink.platform);

      if (socialPositions.has(socialLink.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate social link positions are not allowed.",
          path: ["socialLinks", index, "position"],
        });
      }

      socialPositions.add(socialLink.position);
    }

    const linkIds = new Set<string>();
    const linkPositions = new Set<number>();
    for (const [index, linkItem] of value.linkItems.entries()) {
      if (linkIds.has(linkItem.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate link item ids are not allowed.",
          path: ["linkItems", index, "id"],
        });
      }

      linkIds.add(linkItem.id);

      if (linkPositions.has(linkItem.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate link item positions are not allowed.",
          path: ["linkItems", index, "position"],
        });
      }

      linkPositions.add(linkItem.position);
    }

    const textBoxIds = new Set<string>();
    const textBoxPositions = new Set<number>();
    const pageBlockPositions = new Set<number>([value.page.linkBlockPosition]);
    for (const [index, textBoxItem] of value.textBoxItems.entries()) {
      if (textBoxIds.has(textBoxItem.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate text box ids are not allowed.",
          path: ["textBoxItems", index, "id"],
        });
      }

      textBoxIds.add(textBoxItem.id);

      if (textBoxPositions.has(textBoxItem.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate text box positions are not allowed.",
          path: ["textBoxItems", index, "position"],
        });
      }

      textBoxPositions.add(textBoxItem.position);

      if (pageBlockPositions.has(textBoxItem.blockPosition)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate page editor block positions are not allowed.",
          path: ["textBoxItems", index, "blockPosition"],
        });
      }

      pageBlockPositions.add(textBoxItem.blockPosition);
    }
  });

export type ProfilePageUpdateValues = z.infer<typeof profilePageUpdateSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type LinkItemInput = z.infer<typeof linkItemInputSchema>;
export type TextBoxItemInput = z.infer<typeof textBoxItemInputSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export type ProfilePageSyncValues = z.infer<typeof profilePageSyncSchema>;
