import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const quotaSchema = z.object({
  permiumSupport: z.boolean().default(true),
  monthlyImages: z.number(),
  somethingElse: z.string(),
});

export type Quotas = z.infer<typeof quotaSchema>;

export const defaultQuotas: Quotas = {
  permiumSupport: false,
  monthlyImages: 10,
  somethingElse: "something",
};

export const plans = pgTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  codename: text("codename").unique(),
  default: boolean("default").default(false),

  requiredCouponCount: integer("requiredCouponCount").default(0),

  hasOnetimePricing: boolean("hasOnetimePricing").default(false),
  hasMonthlyPricing: boolean("hasMonthlyPricing").default(false),
  hasYearlyPricing: boolean("hasYearlyPricing").default(false),

  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),

  monthlyPrice: integer("monthlyPrice"),
  monthlyPriceAnchor: integer("monthlyPriceAnchor"),
  monthlyStripePriceId: text("monthlyStripePriceId"),
  monthlyLemonSqueezyVariantId: text("monthlyLemonSqueezyVariantId"),
  monthlyDodoProductId: text("monthlyDodoProductId"),
  monthlyPaddlePriceId: text("monthlyPaddlePriceId"),
  monthlyPaypalPlanId: text("monthlyPaypalPlanId"),

  yearlyPrice: integer("yearlyPrice"),
  yearlyPriceAnchor: integer("yearlyPriceAnchor"),
  yearlyStripePriceId: text("yearlyStripePriceId"),
  yearlyLemonSqueezyVariantId: text("yearlyLemonSqueezyVariantId"),
  yearlyDodoProductId: text("yearlyDodoProductId"),
  yearlyPaddlePriceId: text("yearlyPaddlePriceId"),
  yearlyPaypalPlanId: text("yearlyPaypalPlanId"),

  onetimePrice: integer("onetimePrice"),
  onetimePriceAnchor: integer("onetimePriceAnchor"),
  onetimeStripePriceId: text("onetimeStripePriceId"),
  onetimeLemonSqueezyVariantId: text("onetimeLemonSqueezyVariantId"),
  onetimeDodoProductId: text("onetimeDodoProductId"),
  onetimePaddlePriceId: text("onetimePaddlePriceId"),
  onetimePaypalPlanId: text("onetimePaypalPlanId"),

  quotas: jsonb("quotas").$type<Quotas>(),
});
