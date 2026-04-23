import { getAllBlogs } from "@/lib/mdx/blogs";
import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await getAllBlogs();

  // Static pages
  const staticPageRoutes = ["", "/blog"] as const;

  const staticPages = staticPageRoutes.map((route) => ({
    url: absoluteUrl(route === "" ? "/" : route),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Policy pages
  const policyPages = ["/cookie", "/privacy", "/terms", "/refund"].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Blog pages
  const blogPages = blogs.map((blog) => ({
    url: absoluteUrl(`/blog/${blog.slug}`),
    lastModified: new Date(blog.frontmatter.createdDate),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...policyPages, ...blogPages];
}
