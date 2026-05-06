import { betterAuthServer } from "@/auth";
import { createAuthApi } from "@/lib/api/routes/auth";

export const authApi = createAuthApi({
  handler: betterAuthServer.handler,
});
