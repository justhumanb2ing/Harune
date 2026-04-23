import { render } from "@react-email/components";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import { adminAc, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "./db";
import { invitations, members, organizations } from "./db/schema/organization";
import { authAccounts, authSessions, authVerifications, users } from "./db/schema/user";
import InvitationEmail from "./emails/InvitationEmail";
import MagicLinkEmail from "./emails/MagicLinkEmail";
import { env } from "./env";
import { hashPassword, verifyPassword } from "./lib/auth/password";
import { appConfig } from "./lib/config";
import sendMail from "./lib/email/sendMail";
import onUserCreate from "./lib/users/onUserCreate";

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  expires: string;
  activeOrganizationId?: string | null;
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
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const betterAuthServer = betterAuth({
  appName: appConfig.projectName,
  baseURL: env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      account: authAccounts,
      session: authSessions,
      verification: authVerifications,
      organization: organizations,
      member: members,
      invitation: invitations,
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
      trustedProviders: ["google", "github", "credential", "magic-link"],
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
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
  plugins: [
    organization({
      creatorRole: "owner",
      roles: {
        owner: ownerAc,
        admin: adminAc,
        user: memberAc,
      },
      invitationExpiresIn: 60 * 60 * 24 * 7,
      requireEmailVerificationOnInvitation: true,
      sendInvitationEmail: async ({ id, email, organization, invitation, inviter }) => {
        const baseUrl = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;
        const inviteUrl = `${baseUrl}/section`;
        const html = await render(
          InvitationEmail({
            organizationName: organization.name,
            inviterName: inviter.user.name,
            role: invitation.role,
            inviteUrl,
            expiresAt: invitation.expiresAt,
          })
        );

        await sendMail(email, `${organization.name} 조직 초대`, html);
      },
      schema: {
        organization: {
          modelName: "organization",
          fields: {
            logo: "image",
          },
        },
        member: {
          modelName: "member",
        },
        invitation: {
          modelName: "invitation",
        },
        session: {
          fields: {
            activeOrganizationId: "activeOrganizationId",
          },
        },
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        if (process.env.NODE_ENV === "development") {
          console.log(`Magic link for ${email}: ${url} expires at ${expiresAt.toISOString()}`);
        }

        const html = await render(MagicLinkEmail({ url, expiresAt }));
        await sendMail(email, `Sign in to ${appConfig.projectName}`, html);
      },
    }),
    nextCookies(),
  ],
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
    activeOrganizationId: session.session.activeOrganizationId ?? null,
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
