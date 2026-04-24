import { isReservedHandle, isValidHandleFormat, normalizeHandle } from "@/lib/handles";
import { MAX_SOCIAL_LINKS } from "@/lib/profile-page/types";
import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const optionalTextSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().max(280, "Must be 280 characters or fewer.").optional()
);

const optionalUrlSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().url("Enter a valid URL.").optional()
);

const optionalSocialValueSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().trim().optional()
);

export const handleSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeHandle(value) : value),
  z
    .string()
    .min(1, "Handle is required.")
    .refine((value) => isValidHandleFormat(value), {
      message: "Only letters, numbers, and underscores are allowed.",
    })
    .refine((value) => !isReservedHandle(value), {
      message: "This handle is not available.",
    })
);

export const onboardingSchema = z
  .object({
    handle: handleSchema,
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(100, "Name must be 100 characters or fewer."),
    bio: optionalTextSchema,
    image: optionalUrlSchema,
    socialLinks: z
      .object({
        x: optionalSocialValueSchema,
        instagram: optionalSocialValueSchema,
        youtube: optionalSocialValueSchema,
        linkedin: optionalSocialValueSchema,
        github: optionalSocialValueSchema,
        threads: optionalSocialValueSchema,
        soundcloud: optionalSocialValueSchema,
        spotify: optionalSocialValueSchema,
        behance: optionalSocialValueSchema,
        tiktok: optionalSocialValueSchema,
        mail: optionalSocialValueSchema,
        apple_music: optionalSocialValueSchema,
      })
      .default({}),
  })
  .superRefine((value, ctx) => {
    const selectedSocialLinks = Object.values(value.socialLinks).filter(
      (socialLink) => typeof socialLink === "string" && socialLink.trim().length > 0
    );

    if (selectedSocialLinks.length > MAX_SOCIAL_LINKS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You can add up to ${MAX_SOCIAL_LINKS} social links.`,
        path: ["socialLinks"],
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
