function Bar({ style = {} }) {
  return <div className="animate-pulse rounded-lg" style={{ background: 'var(--line-soft)', ...style }} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-[15px] p-[15px] mb-[11px] border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-3">
        <Bar style={{ width: 11, height: 11, borderRadius: '50%' }} />
        <div className="flex-1">
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
    <div className="min-h-screen" style={{ background: 'var(--sheet)' }}>
      <div style={{ height: 160, background: 'var(--sky)' }} />
      <div className="rounded-[22px_22px_0_0] shadow-[0_-8px_24px_rgba(40,40,30,.10)] px-5 pt-[22px] -mt-5" style={{ background: 'var(--sheet)' }}>
        <div className="max-w-[640px] mx-auto">
          <Bar style={{ height: 28, width: '40%', marginBottom: 24 }} />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
