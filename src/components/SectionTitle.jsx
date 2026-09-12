/**
 * SectionTitle Component
 * Purpose: Renders standard, premium gold-accented headings and sub-lines.
 * Ensures consistent, high-end typography and symmetry across storefront view sections.
 * Inlined styles to eliminate external render-blocking stylesheet request on critical path.
 */

const SECTION_TITLE_CSS = `
.section-title.center{text-align:center}
.section-title.left{text-align:left}
.section-title h2{margin:0;font-family:var(--font-heading);font-variant-numeric:lining-nums;font-feature-settings:"lnum";-webkit-font-feature-settings:"lnum";-moz-font-feature-settings:"lnum";font-size:clamp(26px,3.8vw,36px);font-weight:600;letter-spacing:.2px;text-transform:uppercase;max-width:100%;overflow-wrap:break-word}
.section-title span{display:block;width:72px;height:14px;margin:8px auto 0;border-top:2px solid var(--gold);position:relative}
.section-title.left span{margin-left:0}
.section-title span::after{content:'';position:absolute;top:-5px;left:calc(50% - 5px);width:8px;height:8px;transform:rotate(45deg);border:1px solid var(--gold);background:var(--paper)}
@media screen and (max-width:820px){.catalog-toolbar .section-title{margin-bottom:0}.catalog-toolbar .section-title h2{font-size:clamp(26px,7vw,34px)}}
@media screen and (max-width:380px){.section-title h2{font-size:28px!important}}
`;

export function SectionTitle({ title, align = 'center', elementKey }) {
  const key = elementKey || `title_${String(title).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  return (
    <div className={`section-title ${align}`}>
      <style dangerouslySetInnerHTML={{ __html: SECTION_TITLE_CSS }} />
      <h2 data-editable-key={key}>{title}</h2>
      <span />
    </div>
  );
}
