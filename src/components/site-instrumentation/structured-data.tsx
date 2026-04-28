import { appConfig } from "@/lib/config";
import { absoluteUrl, seoConfig } from "@/lib/seo";

type JsonLd = Record<string, unknown>;

type BreadcrumbItem = {
  name: string;
  path: string;
};

type WebPageStructuredDataProps = {
  description: string;
  name: string;
  path: string;
};

const serializeJsonLd = (data: JsonLd) => JSON.stringify(data).replace(/</g, "\\u003c");

function JsonLdScript({ data, id }: { data: JsonLd; id: string }) {
  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as raw script content, and serialized data is escaped.
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
    />
  );
}

export function SiteStructuredData() {
  const organizationId = absoluteUrl("/#organization");
  const websiteId = absoluteUrl("/#website");
  const sameAs = [appConfig.social.twitter].filter(Boolean);
  const navigationItems = [
    { name: "Home", url: absoluteUrl("/") },
    { name: "Leaderboard", url: absoluteUrl("/leaderboard") },
    { name: "Changelog", url: absoluteUrl("/changelog") },
    { name: "Roadmap", url: absoluteUrl("/roadmap") },
    { name: "Privacy Policy", url: absoluteUrl("/privacy") },
    { name: "Terms of Service", url: absoluteUrl("/terms") },
  ];

  return (
    <JsonLdScript
      id="site-structured-data"
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@id": organizationId,
            "@type": "Organization",
            name: seoConfig.siteName,
            url: seoConfig.siteUrl,
            logo: absoluteUrl("/assets/logo.jpeg"),
            description: seoConfig.description,
            ...(sameAs.length > 0 ? { sameAs } : {}),
          },
          {
            "@id": websiteId,
            "@type": "WebSite",
            name: seoConfig.siteName,
            url: seoConfig.siteUrl,
            description: seoConfig.description,
            publisher: {
              "@id": organizationId,
            },
            inLanguage: "en",
          },
          {
            "@type": "ItemList",
            itemListElement: navigationItems.map((item, index) => ({
              "@type": "SiteNavigationElement",
              position: index + 1,
              name: item.name,
              url: item.url,
            })),
          },
        ],
      }}
    />
  );
}

export function WebPageStructuredData({ description, name, path }: WebPageStructuredDataProps) {
  const url = absoluteUrl(path);

  return (
    <JsonLdScript
      id={`webpage-structured-data-${path === "/" ? "home" : path.replaceAll("/", "-")}`}
      data={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: {
          "@id": absoluteUrl("/#website"),
        },
        publisher: {
          "@id": absoluteUrl("/#organization"),
        },
        inLanguage: "en",
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLdScript
      id={`breadcrumb-structured-data-${items.at(-1)?.path.replaceAll("/", "-") ?? "home"}`}
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      }}
    />
  );
}
