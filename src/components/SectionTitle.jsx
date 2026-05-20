/**
 * SectionTitle Component
 * Purpose: Renders standard, premium gold-accented headings and sub-lines.
 * Ensures consistent, high-end typography and symmetry across storefront view sections.
 */
export function SectionTitle({ title, align = 'center' }) {
  return (
    <div className={`section-title ${align}`}>
      <h2>{title}</h2>
      <span />
    </div>
  );
}
