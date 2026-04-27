import PolicyContentSection from "@/components/sections/policy-content-section";
import { getPolicyBySlug } from "@/lib/mdx/policies";
import { absoluteUrl, createPageMetadata, seoConfig } from "@/lib/seo";
import { format } from "date-fns";
import type { Metadata } from "next";
import { WebPageJsonLd } from "next-seo";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPolicyBySlug("privacy");
  if (!policy) return {};

  return createPageMetadata({
    path: "/privacy",
    title: policy.frontmatter.title,
    description: policy.frontmatter.description ?? "",
  });
}

export default async function PrivacyPolicyPage() {
  const policy = await getPolicyBySlug("privacy");

  if (!policy) {
    notFound();
  }

  return (
    <>
      <WebPageJsonLd
        useAppDir
        id={absoluteUrl("/privacy")}
        title={policy.frontmatter.title}
        description={policy.frontmatter.description}
        lastUpdated={policy.frontmatter.lastUpdated}
        isAccessibleForFree={true}
        publisher={{
          "@type": "Organization",
          name: seoConfig.siteName,
          url: seoConfig.siteUrl,
        }}
        about={{
          "@type": "Thing",
          name: "Privacy Policy",
        }}
      />
      <PolicyContentSection
        title={policy.frontmatter.title}
        lastUpdatedLabel={format(new Date(policy.frontmatter.lastUpdated), "MMMM d, yyyy")}
      >
        {policy.content}
      </PolicyContentSection>
    </>
  );
}
