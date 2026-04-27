import PolicyContentSection, { type PolicyContentSectionProps } from "./policy-content-section";

export default function ChangelogSection({
  children,
  lastUpdatedLabel,
  title,
}: PolicyContentSectionProps) {
  return (
    <PolicyContentSection title={title} lastUpdatedLabel={lastUpdatedLabel}>
      {children}
    </PolicyContentSection>
  );
}
