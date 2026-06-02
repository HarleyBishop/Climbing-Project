// Skeleton loading components that match the Ghibli theme palette.
// Used while API data is in flight so the page never shows a blank state.

function Bar({ style = {} }) {
  return <div style={{ background: '#efe7d4', borderRadius: 8, ...style }} className="animate-pulse" />;
}

export function CardSkeleton() {
  return (
    <div style={{ background: '#fffaef', border: '1px solid #e8ddc6', borderRadius: 15, padding: 15, marginBottom: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bar style={{ width: 11, height: 11, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <Bar style={{ height: 15, width: '55%', marginBottom: 8 }} />
          <Bar style={{ height: 11, width: '75%' }} />
        </div>
        <Bar style={{ height: 22, width: 48, borderRadius: 999 }} />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#fbf5e6' }}>
      <div style={{ height: 160, background: 'linear-gradient(180deg,#bfe2dd 0%,#d6e7d8 40%,#eef2dc 78%,#f6f1de 100%)' }} />
      <div style={{ marginTop: -20, background: '#fbf5e6', borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 24px rgba(40,40,30,.10)', padding: '22px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Bar style={{ height: 28, width: '40%', marginBottom: 24 }} />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
