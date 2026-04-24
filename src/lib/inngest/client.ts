import { env } from "@/env";
import { sentryMiddleware } from "@inngest/middleware-sentry";
import { Inngest, eventType, staticSchema } from "inngest";
import { appConfig } from "../config";
import type { InngestEvents } from "./functions";

export const testHelloWorldEvent = eventType("test/hello.world", {
  schema: staticSchema<InngestEvents["test/hello.world"]["data"]>(),
});

export const inngest = new Inngest({
  id: appConfig.projectSlug,
  middleware: env.NEXT_PUBLIC_SENTRY_DSN ? [sentryMiddleware()] : undefined,
});
