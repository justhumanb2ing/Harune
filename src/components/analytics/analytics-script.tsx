import { env } from "@/env";

const BETTERLYTICS_DEFAULT_SRC = "https://betterlytics.io/analytics.js";
const UMAMI_DEFAULT_SRC = "https://cloud.umami.is/script.js";

const ANALYTICS_PROVIDERS = ["betterlytics", "umami"] as const;
type AnalyticsProvider = (typeof ANALYTICS_PROVIDERS)[number];

const normalizeProvider = (provider?: string): AnalyticsProvider | null => {
  if (!provider) {
    return null;
  }

  const normalizedProvider = provider.toLowerCase();
  if (ANALYTICS_PROVIDERS.includes(normalizedProvider as AnalyticsProvider)) {
    return normalizedProvider as AnalyticsProvider;
  }

  return null;
};

const resolveProvider = (): AnalyticsProvider | null => {
  const configuredProvider = normalizeProvider(env.NEXT_PUBLIC_ANALYTICS_PROVIDER);
  if (configuredProvider) {
    return configuredProvider;
  }

  const hasBetterlytics = Boolean(env.NEXT_PUBLIC_BETTERLYTICS_SITE_ID);
  const hasUmami = Boolean(env.NEXT_PUBLIC_UMAMI_WEBSITE_ID);

  if (hasBetterlytics && !hasUmami) {
    return "betterlytics";
  }

  if (hasUmami && !hasBetterlytics) {
    return "umami";
  }

  return null;
};

export const AnalyticsScript = () => {
  const provider = resolveProvider();

  if (provider === "betterlytics") {
    const siteId = env.NEXT_PUBLIC_BETTERLYTICS_SITE_ID;
    if (!siteId) {
      return null;
    }

    return (
      <script
        async
        src={env.NEXT_PUBLIC_BETTERLYTICS_SCRIPT_SRC || BETTERLYTICS_DEFAULT_SRC}
        data-site-id={siteId}
      />
    );
  }

  if (provider === "umami") {
    const websiteId = env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    if (!websiteId) {
      return null;
    }

    return (
      <script
        defer
        src={env.NEXT_PUBLIC_UMAMI_SCRIPT_SRC || UMAMI_DEFAULT_SRC}
        data-website-id={websiteId}
      />
    );
  }

  return null;
};
