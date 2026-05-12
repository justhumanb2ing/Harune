import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PlanSection from "@/components/website/plan-section";
import { listBillingProducts } from "@/lib/api/generated/http/billing-api/billing-api";
import type { ListBillingProducts200ItemsItem } from "@/lib/api/generated/http/schemas/billing-api";
import { createSignInCallbackHref } from "@/lib/auth/app-entry";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";
import { getServerMe } from "@/lib/users/server-me";

const isProduction = process.env.NODE_ENV === "production";
const planDescription = `Compare ${appConfig.projectName} plans and pricing.`;

const planMetadata: Metadata = createPageMetadata({
  path: "/plan",
  title: "Plans",
  description: planDescription,
  keywords: [...appConfig.keywords, `${appConfig.projectName} plans`, "pricing", "subscription"],
  imageAlt: `${appConfig.projectName} plans preview`,
});

async function getPlanProducts(): Promise<{
  errorMessage: string | null;
  products: ListBillingProducts200ItemsItem[];
}> {
  try {
    const response = await listBillingProducts({ cache: "no-store" });

    if (response.status !== 200) {
      return {
        errorMessage: "We couldn't load the plan data. Please try again later.",
        products: [],
      };
    }

    return {
      errorMessage: null,
      products: response.data.items,
    };
  } catch {
    return {
      errorMessage: "We couldn't load the plan data. Please try again later.",
      products: [],
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  if (isProduction) {
    return {};
  }

  return planMetadata;
}

export default async function PlanPage() {
  if (isProduction) {
    notFound();
  }

  const currentUser = await getServerMe();

  if (!currentUser) {
    redirect(createSignInCallbackHref("/plan"));
  }

  const planData = await getPlanProducts();

  return (
    <main className="relative min-h-dvh">
      <PlanSection
        currentPlan={currentUser.currentPlan ?? undefined}
        errorMessage={planData.errorMessage}
        products={planData.products}
      />
    </main>
  );
}
