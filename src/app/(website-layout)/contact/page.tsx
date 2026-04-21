import { createPageMetadata } from "@/lib/seo";
import ContactPageClient from "./contact-page-client";

export const metadata = createPageMetadata({
  path: "/contact",
  title: "Contact",
  description: "Get in touch with us. We'd love to hear from you.",
});

export default function ContactPage() {
  return <ContactPageClient />;
}
