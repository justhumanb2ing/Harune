import { z } from "zod";
import { handleSchema } from "@/lib/validations/auth.schema";

export const rootHandleAvailabilityQuerySchema = z.object({
  handle: handleSchema,
});

export const crawlQuerySchema = z.object({
  url: z.string().min(1, "Missing URL."),
});
