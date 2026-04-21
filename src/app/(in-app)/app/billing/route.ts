import { db } from "@/db";
import { paypalContext } from "@/db/schema/paypal";
import { users } from "@/db/schema/user";
import { env } from "@/env";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import client from "@/lib/dodopayments/client";
import { createPaddleCustomerPortalSession } from "@/lib/paddle";
import stripe from "@/lib/stripe";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export const GET = withAuthRequired(async (req, context) => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, context.session.user.id))
    .limit(1)
    .then((users) => users[0]);

  const dodoCustomerId = user.dodoCustomerId;
  if (dodoCustomerId) {
    const customerPortalSession = await client.customers.customerPortal.create(dodoCustomerId);
    return redirect(customerPortalSession.link);
  }

  const paddleCustomerId = user.paddleCustomerId;
  if (paddleCustomerId) {
    const portalSession = await createPaddleCustomerPortalSession(paddleCustomerId);
    if (portalSession.urls?.general?.overview) {
      return redirect(portalSession.urls.general.overview);
    }
    return NextResponse.json({
      message: "Unable to create Paddle customer portal session.",
    });
  }

  const stripeCustomerId = user.stripeCustomerId;

  if (stripeCustomerId) {
    // create customer portal link
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_APP_URL}/app`,
    });
    return redirect(portalSession.url);
  }
  const lemonSqueezyCustomerId = user.lemonSqueezyCustomerId;
  if (lemonSqueezyCustomerId) {
    // TODO: Get lemonSqueezy customer and redirect to lemonSqueezy customer portal
  }

  // Check if has paypal context
  const paypalContexts = await db
    .select()
    .from(paypalContext)
    .where(eq(paypalContext.userId, user.id));
  if (paypalContexts.length > 0) {
    return redirect(`${env.NEXT_PUBLIC_APP_URL}/app/billing/paypal`);
  }

  return NextResponse.json({
    message: "You are not subscribed to any plan.",
  });
});
