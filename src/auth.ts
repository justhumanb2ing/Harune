import { redirect } from "next/navigation";

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  expires: string;
}

// Backend auth wiring is intentionally disabled while the frontend is
// detached from the new server.
export const betterAuthServer = {
  api: {
    getSession: async () => null,
    signOut: async () => {
      return;
    },
  },
  handler: () => new Response("Auth backend is disabled.", { status: 503 }),
};

export const auth = async (): Promise<AuthSession | null> => {
  return null;
};

export const signIn = (callbackUrl?: string) => {
  const next = callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in";
  return redirect(next);
};

export const signOut = async () => {
  return;
};
