import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import MdxContentSection from "@/components/website/mdx-content-section";
import { getPolicyBySlug } from "@/lib/mdx/policies";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPolicyBySlug("terms");
  if (!policy) return {};

  return createPageMetadata({
    path: "/terms",
    title: policy.frontmatter.title,
    description: policy.frontmatter.description ?? "",
  });
}

export default async function TermsPage() {
  const policy = await getPolicyBySlug("terms");

  if (!policy) {
    notFound();
  }

  return (
    <>
      <WebPageJsonLd
        id="https://harune.me/terms"
        description={policy.frontmatter.description ?? ""}
        title={policy.frontmatter.title}
        lastUpdated={policy.frontmatter.lastUpdated}
        isAccessibleForFree
        publisher={{
          "@type": "Organization",
          name: "Harune",
          url: "https://harune.me",
        }}
        about={{
          "@type": "Thing",
          name: "Terms of Service",
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Terms of Service", path: "/terms" },
        ]}
      />
      <MdxContentSection
        title={policy.frontmatter.title}
        lastUpdatedLabel={format(new Date(policy.frontmatter.lastUpdated), "MMMM d, yyyy")}
      >
        {policy.content}
      </MdxContentSection>
    </>
  );
}
