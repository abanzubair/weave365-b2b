import CatalogPageSkeleton from '../../src/components/CatalogPageSkeleton.jsx';

export default function Loading() {
  return (
    <section className="section catalog-page">
      <div className="catalog-grid" aria-hidden="true">
        <CatalogPageSkeleton count={12} wrap={false} />
      </div>
    </section>
  );
}
