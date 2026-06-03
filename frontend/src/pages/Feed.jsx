import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { Card, Avatar, Stars, SectionLabel } from '../components/ui/primitives';
import { HOLD } from '../theme';

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
  const colour = HOLD[item.climb_colour] || '#cd6f3f';
  const isSend = item.type === 'send';

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex items-stretch">
        <div className="w-[6px] shrink-0" style={{ background: colour }} />

        <div className="flex-1 px-[14px] py-[13px]">
          <div className="flex items-center justify-between mb-[10px]">
            <button
              onClick={() => navigate(`/profile/${item.user_id}`)}
              className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
            >
              <Avatar name={item.username} size={28} />
              <span className="font-body font-bold text-[13px] text-ink">@{item.username}</span>
            </button>
            <span className="font-body text-[11px] text-ink3">{timeAgo(item.timestamp)}</span>
          </div>

          <p className="font-serif italic text-[13.5px] text-ink2 m-0 mb-[6px]">
            {isSend ? `sent in ${item.attempts} attempt${item.attempts !== 1 ? 's' : ''}` : 'left a review'}
          </p>

          <button
            onClick={() => navigate(`/gym/${item.gym_id}/wall/${item.wall_id}/climb/${item.climb_id}`)}
            className="w-full bg-line-soft border border-line rounded-[10px] px-3 py-[9px] cursor-pointer text-left flex items-center gap-[10px]"
          >
            <div className="w-7 h-7 rounded-[7px] shrink-0 flex items-center justify-center font-body font-bold text-[10px] text-white" style={{ background: colour }}>
              V{item.climb_grade}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-[14.5px] m-0 text-ink leading-[1.1]">{item.climb_name}</p>
              <p className="font-body text-[11px] text-ink2 mt-[2px] mb-0">{item.wall_name} · {item.gym_name}</p>
            </div>
          </button>

          {!isSend && item.comment && (
            <div className="mt-[10px]">
              <p className="font-serif italic text-sm leading-[1.4] text-ink m-0 mb-[6px]">
                "{item.comment}"
              </p>
              <Stars n={item.stars} />
            </div>
          )}
        </div>
      </div>
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
    <PageShell back backLabel="Home" backPath="/" eyebrow="People you follow" title="Activity feed" heroHeight={152}>
      {error && (
        <p className="font-serif italic text-danger text-sm text-center py-8">{error}</p>
      )}

      {!error && feed.length === 0 && (
        <div className="text-center py-12">
          <p className="font-display text-[22px] text-ink m-0 mb-[10px]">Nothing here yet</p>
          <p className="font-serif italic text-[14.5px] text-ink3 m-0 mb-6 leading-[1.5]">
            Follow other climbers from their profile page to see their sends and reviews here.
          </p>
        </div>
      )}

      {feed.length > 0 && (
        <div className="flex flex-col gap-[14px]">
          {feed.map(item => (
            <FeedItem key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default Feed;
