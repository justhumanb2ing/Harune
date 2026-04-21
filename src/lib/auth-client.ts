import { magicLinkClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { adminAc, memberAc, ownerAc } from "better-auth/plugins/organization/access";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    magicLinkClient(),
    organizationClient({
      roles: {
        owner: ownerAc,
        admin: adminAc,
        user: memberAc,
      },
    }),
  ],
});
