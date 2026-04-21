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

export const socialPlatformSchema = z.enum(["x", "instagram", "youtube", "linkedin", "github"]);

export const profilePageUpdateSchema = z.object({
  handle: handleSchema,
  name: requiredText("Name", 100),
  bio: optionalNullableText(280),
  image: nullableUrl,
});

export const socialLinkInputSchema = z.object({
  platform: socialPlatformSchema,
  url: z.string().trim().url("Enter a valid URL."),
});

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

export type ProfilePageUpdateValues = z.infer<typeof profilePageUpdateSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkInputSchema>;
export type LinkItemInput = z.infer<typeof linkItemInputSchema>;
export type TextBoxItemInput = z.infer<typeof textBoxItemInputSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
