import { CTA2 } from "@/components/website/cta-2";
import { getAllBlogs } from "@/lib/mdx/blogs";
import { absoluteUrl, createPageMetadata, seoConfig } from "@/lib/seo";
import { Tag } from "lucide-react";
import { BreadcrumbJsonLd, WebPageJsonLd } from "next-seo";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = createPageMetadata({
  path: "/blog",
  title: "Blog",
  description: `Discover how to use ${seoConfig.siteName}`,
});

export default async function BlogListPage() {
  const blogs = await getAllBlogs();

  if (blogs.length === 0) {
    return notFound();
  }

  return (
    <article className="py-16 md:py-32">
      <WebPageJsonLd
        useAppDir
        id={absoluteUrl("/blog")}
        title={`Blog | ${seoConfig.siteName}`}
        description={`Discover how to use ${seoConfig.siteName}`}
        isAccessibleForFree={true}
        publisher={{
          "@type": "Organization",
          name: seoConfig.siteName,
          url: seoConfig.siteUrl,
        }}
      />
      <BreadcrumbJsonLd
        useAppDir
        itemListElements={[
          {
            position: 1,
            name: "Home",
            item: seoConfig.siteUrl,
          },
          {
            position: 2,
            name: "Blog",
            item: absoluteUrl("/blog"),
          },
        ]}
      />

      <div className="mx-auto max-w-6xl px-6">
        {/* Hero Section */}
        <header className="text-center mb-12 md:mb-20">
          <h1 className="text-4xl font-semibold mb-4 md:text-5xl lg:text-6xl">Articles</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover how to use {seoConfig.siteName} to get most out of it.
          </p>
        </header>

        {/* Blog Posts Grid */}
        <main>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogs.map((blog) => (
              <article key={blog.slug} className="flex flex-col group">
                <Link href={`/blog/${blog.slug}`}>
                  <div className="bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full shadow-zinc-950/5">
                    {/* Featured Image */}
                    {blog.frontmatter.featuredImage && (
                      <figure className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={blog.frontmatter.featuredImage}
                          alt={blog.frontmatter.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </figure>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <header>
                        <h2 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                          {blog.frontmatter.title}
                        </h2>
                      </header>
                      <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                        {blog.frontmatter.description}
                      </p>

                      {/* Tags */}
                      <footer className="flex flex-wrap gap-2">
                        {blog.frontmatter.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </footer>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </main>

        <footer className="mt-16 md:mt-24">
          <CTA2 />
        </footer>
      </div>
    </article>
  );
}
