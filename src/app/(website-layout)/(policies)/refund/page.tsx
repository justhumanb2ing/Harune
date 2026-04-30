import { format } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BreadcrumbJsonLd, WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import { getPolicyBySlug } from "@/lib/mdx/policies";
import { createPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await getPolicyBySlug("refund");
  if (!policy) return {};

  return createPageMetadata({
    path: "/refund",
    title: policy.frontmatter.title,
    description: policy.frontmatter.description ?? "",
  });
}

export default async function RefundPolicyPage() {
  const policy = await getPolicyBySlug("refund");

  if (!policy) {
    notFound();
  }

  return (
    <>
      <WebPageJsonLd
        id="https://harune.me/refund"
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
          name: "Refund Policy",
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Refund Policy", path: "/refund" },
        ]}
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
