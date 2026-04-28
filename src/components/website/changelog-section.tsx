import MdxContentSection, { type MdxContentSectionProps } from "./mdx-content-section";

export default function ChangelogSection({
  children,
  lastUpdatedLabel,
  title,
}: MdxContentSectionProps) {
  return (
    <MdxContentSection title={title} lastUpdatedLabel={lastUpdatedLabel}>
      {children}
    </MdxContentSection>
  );
}
