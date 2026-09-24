export default function BlogListSkeleton() {
  return (
    <div style={{ minHeight: '80vh', maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', boxSizing: 'border-box' }}>
      <div style={{ height: '36px', width: '280px', backgroundColor: 'var(--cream, #f5f2eb)', borderRadius: '4px', marginBottom: '1rem' }} />
      <div style={{ height: '20px', width: '420px', maxWidth: '100%', backgroundColor: 'var(--cream, #f5f2eb)', borderRadius: '4px', marginBottom: '2.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ height: '360px', backgroundColor: 'var(--cream, #f5f2eb)', borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  );
}
