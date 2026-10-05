import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getDecodedToken } from '../auth';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, RankBadge, RANKS, MAGNUS_RANK } from '../utils/rankUtils';
import { Card, Chip, SectionLabel, Avatar, Empty, ErrorScreen, ProgressBar } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';
import { NumberTicker } from '../components/magicui/number-ticker';
import { cn } from '../lib/utils';

const GRADE_POINTS = [
  { label: 'V0 – V2', points: 10 },
  { label: 'V3 – V4', points: 20 },
  { label: 'V5 – V6', points: 40 },
  { label: 'V7 – V8', points: 70 },
  { label: 'V9 – V10', points: 100 },
  { label: 'V11+', points: 150 },
];

// Top three, laid out 2-1-3 like a podium.
function Podium({ entries, currentUserId, onPick }) {
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  return (
    <div className="mb-10 grid grid-cols-3 items-end gap-3">
      {order.map(e => (
        <Card
          key={e.user_id}
          onClick={() => onPick(e.user_id)}
          className={cn('flex flex-col items-center px-3 text-center', e.rank === 1 ? 'pt-8 pb-7' : 'pt-6 pb-5', e.user_id === currentUserId && 'ring-2 ring-accent')}
        >
          <span className="text-sm font-semibold text-faint">#{e.rank}</span>
          <Avatar name={e.username} size={e.rank === 1 ? 64 : 48} className="my-3" />
          <p className="w-full truncate text-sm font-semibold">@{e.username}</p>
          <p className="mt-1 text-2xl font-semibold"><NumberTicker value={e.points} /></p>
          <p className="text-xs text-muted">points</p>
        </Card>
      ))}
    </div>
  );
}

function Leaderboard() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const currentUserId = getDecodedToken()?.user_id;

  const [gym, setGym] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, rankRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/`),
          api.get(`/api/gyms/${gymId}/leaderboard/`),
        ]);
        setGym(gymRes.data);
        setRankings(rankRes.data);
      } catch { setError('Failed to load leaderboard. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [gymId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const maxPoints = rankings[0]?.points || 1;
  const toProfile = (id) => navigate(`/profile/${id}`);

  return (
    <PageShell back backLabel={gym.name} backPath={`/gym/${gymId}`} eyebrow={`${gym.name} · ${gym.climb_count} active climbs`} title="Leaderboard">
      {rankings.length === 0 && <Empty>No sends logged yet. Be the first!</Empty>}
      {rankings.length > 0 && <Podium entries={rankings.slice(0, 3)} currentUserId={currentUserId} onPick={toProfile} />}

      <div className="space-y-2">
        {rankings.slice(3).map(entry => {
          const isMe = entry.user_id === currentUserId;
          return (
            <Card key={entry.user_id} onClick={() => toProfile(entry.user_id)} className={cn('flex items-center gap-4 px-5 py-3', isMe && 'ring-2 ring-accent')}>
              <span className="w-6 text-center font-semibold text-faint">{entry.rank}</span>
              <Avatar name={entry.username} size={32} />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">@{entry.username}</span>
                  {isMe && <Chip tone="you">You</Chip>}
                </div>
                <ProgressBar pct={Math.round((entry.points / maxPoints) * 100)} />
              </div>
              <RankBadge rank={getRank(entry.points, entry.rank)} showName={false} iconSize={15} />
              <span className="w-14 text-right text-sm font-semibold">{entry.points.toLocaleString()}</span>
            </Card>
          );
        })}
      </div>

      <BlurFade inView className="mt-16">
        <SectionLabel>Rank tiers</SectionLabel>
        <Card className="divide-y divide-line">
          {RANKS.map(rk => (
            <div key={rk.name} className="flex items-center gap-4 px-5 py-3">
              <div className="w-28"><RankBadge rank={rk} /></div>
              <div className="flex-1"><ProgressBar pct={Math.max(4, Math.round((rk.min / 4500) * 100))} colour={rk.color} /></div>
              <span className="w-16 text-right text-sm text-muted">{rk.min === 0 ? '0 pts' : `${rk.min.toLocaleString()}+`}</span>
            </div>
          ))}
          <div className="flex items-center gap-4 px-5 py-3">
            <div className="w-28"><RankBadge rank={MAGNUS_RANK} /></div>
            <p className="flex-1 text-sm text-muted">Top 20 at this gym</p>
          </div>
        </Card>
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel>Points per grade</SectionLabel>
        <Card className="divide-y divide-line">
          {GRADE_POINTS.map(t => (
            <div key={t.label} className="flex items-center gap-4 px-5 py-3">
              <span className="w-20 text-sm font-medium">{t.label}</span>
              <div className="flex-1"><ProgressBar pct={Math.round((t.points / 150) * 100)} /></div>
              <span className="w-16 text-right text-sm font-semibold">{t.points} pts</span>
            </div>
          ))}
        </Card>
      </BlurFade>
    </PageShell>
  );
}

export default Leaderboard;
