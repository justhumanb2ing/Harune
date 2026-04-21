import { db } from "@/db";
import { plans } from "@/db/schema/plans";
import { users } from "@/db/schema/user";
import Welcome from "@/emails/Welcome";
import { render } from "@react-email/components";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { appConfig } from "../config";
import { enableCredits, onRegisterCredits } from "../credits/config";
import type { CreditType } from "../credits/credits";
import { addCredits } from "../credits/recalculate";
import sendMail from "../email/sendMail";
import { isSignupEmailSendingEnabled } from "../email/signupMailPolicy";

const onUserCreate = async (newUser: {
  id: string;
  email: string | null;
  name?: string | null;
}) => {
  const defaultPlan = await db.select().from(plans).where(eq(plans.default, true)).limit(1);

  if (defaultPlan.length > 0) {
    await db.update(users).set({ planId: defaultPlan[0].id }).where(eq(users.id, newUser.id));
  }

  if (enableCredits) {
    // Add welcome credits based on configuration
    for (const [creditType, config] of Object.entries(onRegisterCredits)) {
      const expiryDate = config.expiryAfter ? addDays(new Date(), config.expiryAfter) : null;

      await addCredits(
        newUser.id,
        creditType as CreditType,
        config.amount,
        `welcome_credits_${creditType}_${newUser.id}`,
        {
          reason: "Welcome credits",
        },
        expiryDate
      );
    }
  }

  // TIP: Send welcome email to user

  if (isSignupEmailSendingEnabled && newUser.email) {
    const html = await render(
      Welcome({
        userName: newUser.name || "User",
        dashboardUrl: `${appConfig.projectName}/dashboard`,
      })
    );
    await sendMail(newUser.email, `Welcome to ${appConfig.projectName}`, html);
  }
};

export default onUserCreate;
