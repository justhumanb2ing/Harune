import { z } from "zod";
import { onboardingSchema } from "@/lib/validations/auth.schema";
import { profileUpdateSchema } from "@/lib/validations/profile.schema";

export const appProfileUpdateJsonSchema = profileUpdateSchema;

export const appUploadImageJsonSchema = z.object({
  fileName: z.string().min(1).optional(),
  fileSize: z.number().positive().optional(),
  fileType: z.string().min(1).optional(),
});

export const appOnboardingJsonSchema = onboardingSchema;
