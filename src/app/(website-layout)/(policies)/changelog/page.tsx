import ChangelogSection from "@/components/sections/changelog-section";
import { getPolicyBySlug } from "@/lib/mdx/policies";
import { absoluteUrl, createPageMetadata, seoConfig } from "@/lib/seo";
import { format } from "date-fns";
import type { Metadata } from "next";
import { WebPageJsonLd } from "next-seo";
import { notFound } from "next/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPolicyBySlug("changelog");
  if (!policy) return {};

  return createPageMetadata({
    path: "/changelog",
    title: policy.frontmatter.title,
    description: policy.frontmatter.description ?? "",
  });
}

export default async function ChangelogPage() {
  const policy = await getPolicyBySlug("changelog");

  if (!policy) {
    notFound();
  }

  return (
    <>
      <WebPageJsonLd
        useAppDir
        id={absoluteUrl("/changelog")}
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
          name: "Changelog",
        }}
      />
      <ChangelogSection
        title={policy.frontmatter.title}
        lastUpdatedLabel={format(new Date(policy.frontmatter.lastUpdated), "MMMM d, yyyy")}
      >
        {policy.content}
      </ChangelogSection>
    </>
  );
}
