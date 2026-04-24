import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "./db";
import { authAccounts, authSessions, authVerifications, users } from "./db/schema/user";
import { env } from "./env";
import { appConfig } from "./lib/config";
import onUserCreate from "./lib/users/onUserCreate";

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  expires: string;
}

const isSignInEnabled = () => env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
};

export const betterAuthServer = betterAuth({
  appName: appConfig.projectName,
  baseURL: {
    allowedHosts: ["localhost:3000", "*.vercel.app"],
    protocol: process.env.NODE_ENV === "production" ? "https" : "http",
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: authAccounts,
      session: authSessions,
      verification: authVerifications,
    },
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  user: {
    fields: {
      emailVerified: "emailVerifiedBool",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "email-password"],
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: Object.keys(socialProviders).length > 0 ? socialProviders : undefined,
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!isSignInEnabled() && ctx.path.startsWith("/sign-in")) {
        throw new APIError("FORBIDDEN", {
          message: "Sign in is currently disabled",
        });
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await onUserCreate({
            id: user.id,
            email: user.email,
            name: user.name,
          });
        },
      },
      update: {
        after: async (user) => {
          if (!user.emailVerified) {
            return;
          }

          await db
            .update(users)
            .set({
              emailVerified: new Date(),
              emailVerifiedBool: true,
              updatedAt: new Date(),
            })
            .where(and(eq(users.id, user.id), isNull(users.emailVerified)));
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export const auth = async (): Promise<AuthSession | null> => {
  const requestHeaders = await headers();
  const session = await betterAuthServer.api.getSession({
    headers: requestHeaders,
  });

  if (!session?.user?.email) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
    },
    expires: session.session.expiresAt.toISOString(),
  };
};

export const signIn = (callbackUrl?: string) => {
  const next = callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in";
  return redirect(next);
};

export const signOut = async () => {
  await betterAuthServer.api.signOut({
    headers: await headers(),
  });
};
