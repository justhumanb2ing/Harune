import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  path: "/changelog",
  title: "Changelog",
  description: "See the latest Harune product updates and improvements.",
});

export default function ChangelogPage() {
  return (
    <main>
      <h1>Changelog</h1>
    </main>
  );
}
