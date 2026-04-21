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
      <header className="mb-12 space-y-4 text-center">
        <h1 className="text-4xl font-semibold md:text-5xl">{policy.frontmatter.title}</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {format(new Date(policy.frontmatter.lastUpdated), "MMMM d, yyyy")}
        </p>
      </header>

      <main className="policy-content">{policy.content}</main>
    </>
  );
}
