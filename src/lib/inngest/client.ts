import { env } from "@/env";
import { sentryMiddleware } from "@inngest/middleware-sentry";
import { Inngest } from "inngest";
import { EventSchemas } from "inngest";
import { appConfig } from "../config";
import type { InngestEvents } from "./functions";

const schemas = new EventSchemas().fromRecord<InngestEvents>();

export const inngest = new Inngest({
  id: appConfig.projectSlug,
  schemas,
  middleware: env.NEXT_PUBLIC_SENTRY_DSN ? [sentryMiddleware()] : undefined,
});
