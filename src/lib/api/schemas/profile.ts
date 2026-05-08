import { z } from "zod";
import {
  profileBentoSyncSchema,
  profilePageSyncSchema,
  profilePageUpdateSchema,
} from "@/lib/validations/profile-content.schema";

export const profilePageUpdateJsonSchema = profilePageUpdateSchema;

export const profilePageSyncJsonSchema = profilePageSyncSchema;

export const profileBentoSyncJsonSchema = profileBentoSyncSchema;

export const profileImageFinalizeJsonSchema = z.object({
  imageKind: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const profileImageDeleteJsonSchema = z.object({
  imageUrl: z.string().optional(),
});
