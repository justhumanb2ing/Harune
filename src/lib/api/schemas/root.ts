import { z } from "zod";
import { handleSchema } from "@/lib/validations/auth.schema";

export const rootHandleAvailabilityQuerySchema = z.object({
  handle: handleSchema,
});
