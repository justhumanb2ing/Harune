"use client";

import * as React from "react";
import type { ListBillingProducts200ItemsItem } from "@/lib/api/generated/http/schemas/billing-api";
import type { GetMe200CurrentPlan } from "@/lib/api/generated/http/schemas/me-api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { CheckIcon } from "lucide-react";

type BillingProduct = ListBillingProducts200ItemsItem;

type PlanSectionProps = {
  products: ListBillingProducts200ItemsItem[];
  errorMessage?: string | null;
  currentPlan?: GetMe200CurrentPlan;
};

function formatProductPrice(product: BillingProduct) {
  if (product.price === null) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);
}

const Wave = () => (
  <svg
    width="129"
    height="1387"
    viewBox="0 0 129 1387"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M11.2131 11L106.283 106.07M106.283 106.07L117.279 117.066M106.283 106.07L22.2962 190.003M106.283 106.07L116.688 95.6708M11.2962 200.997L22.2962 190.003M22.2962 190.003L11.2529 178.96M22.2962 190.003L106.323 274.03M106.323 274.03L117.319 285.026M106.323 274.03L22.4537 357.846M106.323 274.03L116.728 263.631M11.3361 368.957L22.4537 357.846M22.4537 357.846L11.5493 346.901M22.4537 357.846L106.44 442.149M106.44 442.149L117.416 453.166M106.44 442.149L22.2962 525.925M106.44 442.149L116.865 431.769M11.2756 536.897L22.2962 525.925M22.2962 525.925L11.2737 514.861M22.2962 525.925L106.165 610.109M106.165 610.109L117.14 621.126M106.165 610.109L11 704.857M106.165 610.109L116.59 599.729M11.2131 683L106.283 778.07M106.283 778.07L117.279 789.066M106.283 778.07L22.2962 862.003M106.283 778.07L116.688 767.671M11.2962 872.997L22.2962 862.003M22.2962 862.003L11.2529 850.96M22.2962 862.003L106.323 946.03M106.323 946.03L117.319 957.026M106.323 946.03L22.4537 1029.85M106.323 946.03L116.728 935.631M11.3361 1040.96L22.4537 1029.85M22.4537 1029.85L11.5493 1018.9M22.4537 1029.85L106.44 1114.15M106.44 1114.15L117.416 1125.17M106.44 1114.15L22.2962 1197.92M106.44 1114.15L116.865 1103.77M11.2756 1208.9L22.2962 1197.92M22.2962 1197.92L11.2737 1186.86M22.2962 1197.92L106.165 1282.11M106.165 1282.11L117.14 1293.13M106.165 1282.11L11 1376.86M106.165 1282.11L116.59 1271.73"
      stroke="#282828"
      strokeWidth="31"
    />
  </svg>
);

const Cross = () => (
  <svg
    width="130"
    height="130"
    viewBox="0 0 130 130"
    fill="none"
    className="scale-125"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M11 11L118.899 119M11.101 119L119 11" stroke="#282828" strokeWidth="31" />
  </svg>
);

type PricingWrapperProps = {
  children: React.ReactNode;
  className?: string;
  type?: "waves" | "crosses";
  actionLabel: string;
  actionDisabled?: boolean;
  onAction: () => void;
};

function PricingWrapper({
  children,
  className,
  type = "waves",
  actionLabel,
  actionDisabled,
  onAction,
}: PricingWrapperProps) {
  return (
    <article
      className={cn(
        "relative h-[600px] w-full min-h-[300px] max-h-[500px] max-w-sm overflow-hidden rounded-xl surface-bevel shadow-float text-white",
        className
      )}
    >
      <span className="absolute left-0 top-0 z-[2] flex h-full w-full flex-col items-start justify-start gap-7 p-4 sm:gap-10">
        {children}
        <div className="flex h-full w-full items-end justify-end text-base">
          <Button
            type="button"
            size={'lg'}
            variant={'ghost'}
            disabled={actionDisabled}
            onClick={onAction}
            className="h-12 w-full rounded-lg font-bold text-lg bg-background text-foreground"
          >
            {actionLabel}
          </Button>
        </div>
      </span>

      {type === "waves" ? (
        <>
          <div className="waves absolute -top-[106px] left-0 z-0 h-fit w-fit sm:left-4">
            <Wave />
          </div>
          <div className="waves absolute -top-[106px] right-0 z-0 h-fit w-fit sm:right-4">
            <Wave />
          </div>
        </>
      ) : (
        <>
          <div className="absolute -left-10 top-0 z-0 h-fit w-fit animate-[spin_5s_linear_infinite]">
            <Cross />
          </div>
          <div className="absolute -right-12 top-1/2 z-0 h-fit w-fit animate-[spin_5s_linear_infinite]">
            <Cross />
          </div>
          <div className="absolute -left-5 top-[85%] z-0 h-fit w-fit animate-[spin_5s_linear_infinite]">
            <Cross />
          </div>
        </>
      )}
    </article>
  );
}

export const Heading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={cn("text-[clamp(1.7rem,10vw,3rem)] font-bold leading-[1] sm:text-5xl", className)}>
    {children}
  </h2>
);

export const Price = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    style={{ lineHeight: "1" }}
    className={cn("text-[clamp(1.7rem,10vw,3rem)] font-bold sm:text-5xl", className)}
  >
    {children}
  </div>
);

export const Paragraph = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("text-lg font-semibold", className)}>
    {children}
  </div>
);

export default function PlanSection({ products, errorMessage, currentPlan }: PlanSectionProps) {
  const session = authClient.useSession();
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const isBusy = pendingAction !== null;

  const isCurrentPlanProduct = (product: BillingProduct) => {
    if (!currentPlan) {
      return false;
    }

    return currentPlan.id === product.id || currentPlan.codename === product.slug;
  };

  const handleCheckout = async (product: BillingProduct) => {
    if (isCurrentPlanProduct(product)) {
      setMessage("You can't checkout the current plan.");
      return;
    }

    const userId = session.data?.user.id;

    if (!userId) {
      setMessage("Please sign in to start checkout.");
      return;
    }

    setMessage(null);
    setPendingAction(product.productId);

    try {
      const { data: checkoutSession, error } = await authClient.dodopayments.checkoutSession({
        slug: product.slug,
        referenceId: userId,
        metadata: {
          userId,
        },
      });

      if (error) {
        setMessage(
          error.message || `We couldn't start checkout for ${product.name || product.productId}.`
        );
        return;
      }

      if (checkoutSession) {
        window.location.href = checkoutSession.url;
      }
    } catch (error) {
      console.error("Failed to create Dodo checkout session:", error);
      setMessage(`We couldn't start checkout for ${product.name || product.productId}.`);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-14 lg:px-10">
      <div className="space-y-4">
        <div className="mx-auto flex w-full flex-wrap justify-center gap-4">
          {products.length > 0 ? (
            products.map((product, index) => {
              const currentPlanProduct = isCurrentPlanProduct(product);
              const actionLabel = pendingAction === product.productId
                  ? "Checking out..."
                  : "Get it now";

              return (
                <PricingWrapper
                  key={product.productId}
                  actionDisabled={isBusy || currentPlanProduct}
                  actionLabel={actionLabel}
                  className={cn(
                    "flex-[1_1_20rem]",
                    product.default ? "bg-indigo-400" : "bg-red-400",
                    products.length === 1 ? "mx-auto" : ""
                  )}
                  onAction={() => handleCheckout(product)}
                  type={index % 2 === 0 ? "crosses" : "waves"}
                >
                  <Heading>{product.name || product.productId}</Heading>
                  <Price>
                    {formatProductPrice(product)}
                    <br />
                    /mo
                  </Price>
                  <Paragraph>
                    {product.quotas ? (
                      <ol>
                        <li className="flex items-center gap-1">
                          <CheckIcon className="size-5 stroke-3"/>
                          <span>feature 1</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckIcon className="size-5 stroke-3"/>
                          <span>feature 1</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <CheckIcon className="size-5 stroke-3"/>
                          <span>feature 1</span>
                        </li>
                      </ol>
                    ) : (
                      <>This plan does not have quota details available.</>
                    )}
                  </Paragraph>
                </PricingWrapper>
              );
            })
          ) : (
            <article className="mx-auto max-w-sm rounded-2xl bg-purple-500 p-4 text-white">
              <Heading>No products available</Heading>
              <Paragraph className="mt-4 text-white/90">
                We couldn't load any products without a valid DODO_PAYMENTS_API_KEY or Dodo Payments
                product configuration.
              </Paragraph>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
