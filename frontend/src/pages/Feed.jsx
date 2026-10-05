import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { Card, Avatar, Stars, Empty } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';
import { holdColour } from '../lib/holds';

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return 'just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function FeedItem({ item }) {
  const navigate = useNavigate();
  const colour = holdColour(item.climb_colour);
  const isSend = item.type === 'send';

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(`/profile/${item.user_id}`)} className="flex cursor-pointer items-center gap-3">
          <Avatar name={item.username} size={36} />
          <span className="text-left">
            <span className="block text-sm font-semibold">@{item.username}</span>
            <span className="block text-sm text-muted">
              {isSend ? `sent in ${item.attempts} attempt${item.attempts !== 1 ? 's' : ''}` : 'left a review'}
            </span>
          </span>
        </button>
        <span className="ml-auto text-xs text-faint">{timeAgo(item.timestamp)}</span>
      </div>

      {!isSend && item.comment && (
        <div className="mb-4">
          <p className="mb-1.5 text-lg leading-snug">“{item.comment}”</p>
          <Stars n={item.stars} />
        </div>
      )}

      <button
        onClick={() => navigate(`/gym/${item.gym_id}/wall/${item.wall_id}/climb/${item.climb_id}`)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface p-3 text-left transition hover:bg-black/5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white" style={{ background: colour }}>
          V{item.climb_grade}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{item.climb_name}</span>
          <span className="block text-xs text-muted">{item.wall_name} · {item.gym_name}</span>
        </span>
      </button>
    </Card>
  );
}

function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/feed/')
      .then(res => setFeed(res.data))
      .catch(() => setError('Failed to load feed.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <PageShell eyebrow="People you follow" title="Activity">
      {error && <p className="py-8 text-center text-danger">{error}</p>}
      {!error && feed.length === 0 && (
        <Empty>Nothing here yet. Follow other climbers from their profile to see their sends and reviews.</Empty>
      )}
      <div className="space-y-4">
        {feed.map((item, i) => (
          // Stagger the first few items, then let the rest reveal on scroll.
          <BlurFade key={`${item.type}-${item.id}`} inView delay={Math.min(i, 5) * 0.05}>
            <FeedItem item={item} />
          </BlurFade>
        ))}
      </div>
    </PageShell>
  );
}

export default Feed;
