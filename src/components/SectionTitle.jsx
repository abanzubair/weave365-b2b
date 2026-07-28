/**
 * SectionTitle Component
 * Purpose: Renders standard, premium gold-accented headings and sub-lines.
 * Ensures consistent, high-end typography and symmetry across storefront view sections.
 */
export function SectionTitle({ title, align = 'center', elementKey }) {
  const key = elementKey || `title_${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  return (
    <div className={`section-title ${align}`}>
      <h2 data-editable-key={key}>{title}</h2>
      <span />
    </div>
  );
}
