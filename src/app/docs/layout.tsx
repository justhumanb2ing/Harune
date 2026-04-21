import { baseOptions } from "@/lib/docs/layout.shared";
import { source } from "@/lib/docs/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./docs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider
      search={{
        enabled: true,
        options: {
          api: "/api/docs/search",
        },
      }}
    >
      <DocsLayout tree={source.pageTree} {...baseOptions()}>
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
