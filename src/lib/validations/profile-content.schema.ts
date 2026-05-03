import { z } from "zod";
import { BENTO_GRID_SIZE_CONSTRAINTS, COLS } from "@/lib/grid/grid-config";
import { playlistProviderOrder } from "@/lib/profile/playlist";
import { MAX_SOCIAL_LINKS } from "@/lib/profile/types";
import { handleSchema } from "@/lib/validations/auth.schema";

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

const googleMapsUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid Google Maps URL.")
  .refine((value) => {
    const hostname = new URL(value).hostname.toLowerCase();

    return (
      hostname === "maps.app.goo.gl" ||
      hostname === "goo.gl" ||
      hostname === "maps.google.com" ||
      hostname === "www.google.com" ||
      hostname.endsWith(".google.com")
    );
  }, "Enter a valid Google Maps URL.");

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
  location: optionalNullableText(100).optional(),
  role: optionalNullableText(100).optional(),
  bio: optionalNullableText(280),
  image: nullableUrl,
  backgroundImage: nullableUrl.optional(),
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

export const playlistProviderSchema = z.enum(playlistProviderOrder);

export const profilePageSyncPlaylistItemSchema = z.object({
  id: entityIdSchema,
  title: requiredText("Title", 100),
  provider: playlistProviderSchema,
  content: z.string().trim().min(1, "Content is required."),
  position: z.number().int().nonnegative(),
  blockPosition: z.number().int().nonnegative(),
});

export const profilePageSyncTextBoxItemSchema = z.object({
  id: entityIdSchema,
  title: requiredText("Title", 100),
  description: z.string().trim().max(1000, "Must be 1000 characters or fewer."),
  position: z.number().int().nonnegative(),
  blockPosition: z.number().int().nonnegative(),
});

const profileBentoLayoutSchema = z.object({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
  w: z.number().int().positive(),
  h: z.number().int().positive(),
});

const profileBentoLayoutsSchema = z.object({
  desktop: profileBentoLayoutSchema,
  compact: profileBentoLayoutSchema,
});

const profileBentoBaseSchema = z.object({
  id: entityIdSchema,
  layout: profileBentoLayoutsSchema,
});

export const profileLinkBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("link"),
  content: z.object({
    title: requiredText("Title", 100),
    description: z.string().trim().max(280, "Must be 280 characters or fewer."),
    favicon: z.string().trim().max(2048, "Must be 2048 characters or fewer."),
    thumbnail: z.string().trim().max(2048, "Must be 2048 characters or fewer."),
    url: z.string().trim().url("Enter a valid URL."),
  }),
});

export const profileTextBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("text"),
  content: z.object({
    content: z.string().trim().min(1, "Content is required.").max(2000),
  }),
});

export const profilePlaylistBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("playlist"),
  content: z.object({
    title: requiredText("Title", 100),
    provider: playlistProviderSchema,
    url: z.string().trim().url("Enter a valid URL."),
    content: z.string().trim().min(1, "Content is required."),
  }),
});

export const profileSectionBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("section"),
  content: z.object({
    title: z.string().trim().min(1, "Title is required."),
  }),
});

export const profileMediaBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("media"),
  content: z.object({
    mediaType: z.enum(["image", "video"]),
    url: z.string().trim().url("Enter a valid media URL."),
    objectKey: entityIdSchema,
    tempObjectKey: z.string().trim().min(1).optional(),
    contentHash: z
      .string()
      .trim()
      .regex(/^[a-f0-9]{64}$/i)
      .optional(),
    contentType: z.string().trim().min(1).optional(),
    href: z.string().trim().max(2048, "Must be 2048 characters or fewer.").nullable(),
    alt: z.string().trim().max(160, "Alt text must be 160 characters or fewer."),
    caption: z.string().trim().max(280, "Caption must be 280 characters or fewer."),
  }),
});

export const profileMapBentoSyncSchema = profileBentoBaseSchema.extend({
  type: z.literal("map"),
  content: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    zoom: z.number().int().min(1).max(18),
    caption: z.string().trim().max(280, "Caption must be 280 characters or fewer."),
    url: googleMapsUrlSchema,
  }),
});

export const profileBentoSyncItemSchema = z.discriminatedUnion("type", [
  profileLinkBentoSyncSchema,
  profileTextBentoSyncSchema,
  profilePlaylistBentoSyncSchema,
  profileSectionBentoSyncSchema,
  profileMediaBentoSyncSchema,
  profileMapBentoSyncSchema,
]);

export const profileBentoSyncSchema = z
  .object({
    bento: z.array(profileBentoSyncItemSchema),
  })
  .superRefine((value, ctx) => {
    const bentoIds = new Set<string>();

    for (const [index, item] of value.bento.entries()) {
      if (bentoIds.has(item.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate bento ids are not allowed.",
          path: ["bento", index, "id"],
        });
      }

      bentoIds.add(item.id);

      for (const breakpoint of ["desktop", "compact"] as const) {
        const layout = item.layout[breakpoint];
        const constraints = BENTO_GRID_SIZE_CONSTRAINTS[item.type];
        const minW = Math.min(constraints.minW, COLS[breakpoint]);
        const maxW = Math.min(constraints.maxW, COLS[breakpoint]);

        if (layout.x + layout.w > COLS[breakpoint]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Bento layout exceeds grid columns.",
            path: ["bento", index, "layout", breakpoint],
          });
        }

        if (layout.w < minW || layout.w > maxW) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Bento width is outside the allowed range.",
            path: ["bento", index, "layout", breakpoint, "w"],
          });
        }

        if (layout.h < constraints.minH || layout.h > constraints.maxH) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Bento height is outside the allowed range.",
            path: ["bento", index, "layout", breakpoint, "h"],
          });
        }
      }
    }
  });

export const profilePageSyncSchema = z
  .object({
    page: z.object({
      handle: handleSchema,
      linkBlockPosition: z.number().int().nonnegative(),
      name: requiredText("Name", 100),
      location: z.string().trim().max(100, "Must be 100 characters or fewer."),
      role: z.string().trim().max(100, "Must be 100 characters or fewer."),
      bio: z.string().trim().max(280, "Must be 280 characters or fewer."),
      image: nullableUrl,
      backgroundImage: nullableUrl,
    }),
    socialLinks: z
      .array(profilePageSyncSocialLinkSchema)
      .max(MAX_SOCIAL_LINKS, `You can add up to ${MAX_SOCIAL_LINKS} social links.`),
    linkItems: z.array(profilePageSyncLinkItemSchema),
    playlistItems: z.array(profilePageSyncPlaylistItemSchema),
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

    const playlistIds = new Set<string>();
    const playlistPositions = new Set<number>();
    const playlistBlockPositions = new Set<number>([value.page.linkBlockPosition]);
    for (const [index, playlistItem] of value.playlistItems.entries()) {
      if (playlistIds.has(playlistItem.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate playlist item ids are not allowed.",
          path: ["playlistItems", index, "id"],
        });
      }

      playlistIds.add(playlistItem.id);

      if (playlistPositions.has(playlistItem.position)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate playlist item positions are not allowed.",
          path: ["playlistItems", index, "position"],
        });
      }

      playlistPositions.add(playlistItem.position);

      if (playlistBlockPositions.has(playlistItem.blockPosition)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate page editor block positions are not allowed.",
          path: ["playlistItems", index, "blockPosition"],
        });
      }

      playlistBlockPositions.add(playlistItem.blockPosition);
    }

    const textBoxIds = new Set<string>();
    const textBoxPositions = new Set<number>();
    const pageBlockPositions = new Set<number>(playlistBlockPositions);
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
export type LinkItemInput = z.infer<typeof linkItemInputSchema>;
export type TextBoxItemInput = z.infer<typeof textBoxItemInputSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export type ProfilePageSyncValues = z.infer<typeof profilePageSyncSchema>;
export type ProfileBentoSyncValues = z.infer<typeof profileBentoSyncSchema>;
