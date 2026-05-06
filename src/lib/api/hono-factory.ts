import type { Context } from "hono";
import { createFactory } from "hono/factory";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { validator } from "hono/validator";
import type { z } from "zod";
import type { AuthSession } from "@/auth";

type AuthenticatedSession = NonNullable<
  AuthSession & {
    user: {
      email: string;
      id: string;
    };
  }
>;

export type ApiBindings = {
  Variables: {
    authenticatedSession: AuthenticatedSession | null;
    session: AuthSession | null;
  };
};

export const apiFactory = createFactory<ApiBindings>();

export const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export const jsonResponse = <Body>(
  context: Context<ApiBindings>,
  body: Body,
  init:
    | number
    | {
        headers?: HeadersInit;
        noStore?: boolean;
        status?: number;
      } = {}
) => {
  const responseInit = typeof init === "number" ? { status: init } : init;
  const headers = new Headers(responseInit.headers);

  if (responseInit.noStore) {
    headers.set("Cache-Control", noStoreHeaders["Cache-Control"]);
  }

  return context.json(body, {
    headers,
    status: (responseInit.status ?? 200) as ContentfulStatusCode,
  });
};

export const unauthorizedResponse = (
  context: Context<ApiBindings>,
  init: { noStore?: boolean } = {}
) =>
  jsonResponse(
    context,
    {
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    },
    { noStore: init.noStore, status: 401 }
  );

export const jsonValidationErrorResponse = (
  context: Context<ApiBindings>,
  body: { description?: string; error: string }
) => jsonResponse(context, body, 400);

export const zJsonValidator = <Schema extends z.ZodType>(
  schema: Schema,
  getErrorBody: (error: z.ZodError<z.output<Schema>>) => { description?: string; error: string },
  init: { noStore?: boolean } = {}
) =>
  validator("json", (value, context) => {
    const validation = schema.safeParse(value);

    if (!validation.success) {
      return jsonResponse(context, getErrorBody(validation.error), {
        noStore: init.noStore,
        status: 400,
      });
    }

    return validation.data;
  });

export const zQueryValidator = <Schema extends z.ZodType>(
  schema: Schema,
  getErrorBody: (error: z.ZodError<z.output<Schema>>) => { description?: string; error: string },
  init: { noStore?: boolean } = {}
) =>
  validator("query", (value, context) => {
    const validation = schema.safeParse(value);

    if (!validation.success) {
      return jsonResponse(context, getErrorBody(validation.error), {
        noStore: init.noStore,
        status: 400,
      });
    }

    return validation.data;
  });
