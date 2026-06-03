import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, RankBadge, RANKS, MAGNUS_RANK } from '../utils/rankUtils';
import { Card, Chip, Eyebrow, Divider, ErrorScreen } from '../components/ui/primitives';

const GRADE_POINTS = [
  { label: 'V0 – V2', points: 10 },
  { label: 'V3 – V4', points: 20 },
  { label: 'V5 – V6', points: 40 },
  { label: 'V7 – V8', points: 70 },
  { label: 'V9 – V10', points: 100 },
  { label: 'V11 – V12+', points: 150 },
];

function Leaderboard() {
  const { gymId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('access');
  const currentUserId = jwtDecode(token).user_id;

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

  const myRank = rankings.find(r => r.user_id === currentUserId);
  const maxPoints = rankings[0]?.points || 1;

  const rankColour = (n) => n === 1 ? 'var(--primary)' : n === 2 ? 'var(--ink2)' : n === 3 ? 'var(--accent)' : 'var(--ink3)';

  return (
    <PageShell back backLabel={gym?.name || 'Back'} backPath={`/gym/${gymId}`} eyebrow={`${gym?.name} · ${gym?.climb_count} active climbs`} title="Leaderboard">

      {myRank && (
        <>
          <Eyebrow style={{ marginBottom: 10 }}>Your ranking</Eyebrow>
          <Card style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', marginBottom: 24, border: '2px solid var(--primary)' }}>
            <span className="font-display text-[26px] min-w-[38px] text-center" style={{ color: rankColour(myRank.rank) }}>#{myRank.rank}</span>
            <div className="flex-1">
              <p className="font-display font-normal text-lg m-0 text-ink">@{myRank.username}</p>
              <div className="flex items-center gap-[7px] mt-[5px]">
                <Chip tone="you">You</Chip>
                <RankBadge rank={getRank(myRank.points, myRank.rank)} />
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-[19px] m-0 text-ink">{myRank.points.toLocaleString()}</p>
              <p className="font-body text-[11px] text-ink2 mt-[2px] mb-0">{myRank.send_count} sends</p>
            </div>
          </Card>
        </>
      )}

      <Eyebrow style={{ marginBottom: 12 }}>Top climbers</Eyebrow>
      <div className="flex flex-col gap-[9px] mb-6">
        {rankings.map(entry => {
          const isMe = entry.user_id === currentUserId;
          const rk = getRank(entry.points, entry.rank);
          const bar = Math.round((entry.points / maxPoints) * 100);
          return (
            <Card
              key={entry.user_id}
              hover
              onClick={() => navigate(`/profile/${entry.user_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: isMe ? '2px solid var(--primary)' : '1px solid var(--line)' }}
            >
              <span className="font-display text-lg min-w-6 text-center" style={{ color: rankColour(entry.rank) }}>{entry.rank}</span>
              <div className="w-8 h-8 rounded-full bg-line-soft border border-line flex items-center justify-center font-body font-bold text-[11px] text-ink shrink-0">
                {entry.username?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-[7px] mb-[6px]">
                  <span className="font-body font-bold text-[13px] text-ink truncate">@{entry.username}</span>
                  {isMe && <Chip tone="you">You</Chip>}
                </div>
                <div className="h-[6px] bg-line-soft rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${bar}%` }} />
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <RankBadge rank={rk} showName={false} iconSize={15} />
                <span className="font-body font-bold text-[12.5px] text-ink">{entry.points.toLocaleString()}</span>
              </div>
            </Card>
          );
        })}
        {rankings.length === 0 && (
          <p className="font-serif italic text-sm text-ink3 text-center py-6">No sends logged yet — be the first!</p>
        )}
      </div>

      <Divider m={4} />

      <Eyebrow style={{ margin: '24px 0 12px' }}>Rank tiers</Eyebrow>
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        {RANKS.map((rk, i) => (
          <div key={rk.name} className="flex items-center gap-[11px] px-[14px] py-[9px]" style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <div style={{ width: 108 }}><RankBadge rank={rk} /></div>
            <div className="flex-1 h-[6px] bg-line-soft rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(4, Math.round((rk.min / 4500) * 100))}%`, background: rk.color }} />
            </div>
            <span className="font-body text-[11px] text-ink2 w-[62px] text-right">{rk.min === 0 ? '0 pts' : `${rk.min.toLocaleString()}+`}</span>
          </div>
        ))}
        <div className="flex items-center gap-[11px] px-[14px] py-[9px]" style={{ borderTop: '1px solid var(--line)' }}>
          <div style={{ width: 108 }}><RankBadge rank={MAGNUS_RANK} /></div>
          <p className="flex-1 font-serif italic text-[12.5px] text-ink2 m-0">Top 20 at this gym</p>
        </div>
      </Card>

      <Eyebrow style={{ marginBottom: 12 }}>Points per grade</Eyebrow>
      <Card style={{ overflow: 'hidden' }}>
        {GRADE_POINTS.map((t, i) => (
          <div key={i} className="flex items-center gap-3 px-[14px] py-[11px]" style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <span className="font-serif italic text-[13.5px] text-ink w-[78px]">{t.label}</span>
            <div className="flex-1 h-[7px] bg-line-soft rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((t.points / 150) * 100)}%` }} />
            </div>
            <span className="font-body font-bold text-[12.5px] text-ink w-[52px] text-right">{t.points} pts</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

export default Leaderboard;
