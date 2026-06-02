import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, RankBadge, RANKS, MAGNUS_RANK } from '../utils/rankUtils';
import { Card, Chip, Eyebrow, Divider } from '../components/ui/primitives';
import { useTheme } from '../theme';

const GRADE_POINTS = [
  { label: 'V0 – V2', points: 10 },
  { label: 'V3 – V4', points: 20 },
  { label: 'V5 – V6', points: 40 },
  { label: 'V7 – V8', points: 70 },
  { label: 'V9 – V10', points: 100 },
  { label: 'V11 – V12+', points: 150 },
];

function Leaderboard() {
  const P = useTheme();
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

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const myRank = rankings.find(r => r.user_id === currentUserId);
  const maxPoints = rankings[0]?.points || 1;

  const rankColour = (n) => n === 1 ? P.primary : n === 2 ? P.ink2 : n === 3 ? P.accent : P.ink3;

  return (
    <PageShell back backLabel={gym?.name || 'Back'} backPath={`/gym/${gymId}`} eyebrow={`${gym?.name} · ${gym?.climb_count} active climbs`} title="Leaderboard">

      {/* Your ranking */}
      {myRank && (
        <>
          <Eyebrow style={{ marginBottom: 10 }}>Your ranking</Eyebrow>
          <Card border={P.primary} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', marginBottom: 24, border: `2px solid ${P.primary}` }}>
            <span style={{ fontFamily: P.disp, fontSize: 26, color: rankColour(myRank.rank), minWidth: 38, textAlign: 'center' }}>#{myRank.rank}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 18, margin: 0, color: P.ink }}>@{myRank.username}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                <Chip tone="you">You</Chip>
                <RankBadge rank={getRank(myRank.points, myRank.rank)} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: P.disp, fontSize: 19, margin: 0, color: P.ink }}>{myRank.points.toLocaleString()}</p>
              <p style={{ fontFamily: P.body, fontSize: 11, color: P.ink2, margin: '2px 0 0' }}>{myRank.send_count} sends</p>
            </div>
          </Card>
        </>
      )}

      {/* Top climbers */}
      <Eyebrow style={{ marginBottom: 12 }}>Top climbers</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
        {rankings.map(entry => {
          const isMe = entry.user_id === currentUserId;
          const rk = getRank(entry.points, entry.rank);
          const bar = Math.round((entry.points / maxPoints) * 100);
          return (
            <Card key={entry.user_id} hover onClick={() => navigate(`/profile/${entry.user_id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', border: isMe ? `2px solid ${P.primary}` : `1px solid ${P.line}` }}>
              <span style={{ fontFamily: P.disp, fontSize: 18, color: rankColour(entry.rank), minWidth: 24, textAlign: 'center' }}>{entry.rank}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: P.lineSoft, border: `1px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: P.body, fontWeight: 700, fontSize: 11, color: P.ink, flexShrink: 0 }}>
                {entry.username?.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{entry.username}</span>
                  {isMe && <Chip tone="you">You</Chip>}
                </div>
                <div style={{ height: 6, background: P.lineSoft, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${bar}%`, background: P.primary, borderRadius: 999 }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <RankBadge rank={rk} showName={false} iconSize={15} />
                <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 12.5, color: P.ink }}>{entry.points.toLocaleString()}</span>
              </div>
            </Card>
          );
        })}
        {rankings.length === 0 && (
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '24px 0' }}>No sends logged yet — be the first!</p>
        )}
      </div>

      <Divider m={4} />

      {/* Rank tiers */}
      <Eyebrow style={{ margin: '24px 0 12px' }}>Rank tiers</Eyebrow>
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        {RANKS.map((rk, i) => (
          <div key={rk.name} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px', borderTop: i ? `1px solid ${P.line}` : 'none' }}>
            <div style={{ width: 108 }}><RankBadge rank={rk} /></div>
            <div style={{ flex: 1, height: 6, background: P.lineSoft, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(4, Math.round((rk.min / 4500) * 100))}%`, background: rk.color, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: P.body, fontSize: 11, color: P.ink2, width: 62, textAlign: 'right' }}>{rk.min === 0 ? '0 pts' : `${rk.min.toLocaleString()}+`}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 14px', borderTop: `1px solid ${P.line}` }}>
          <div style={{ width: 108 }}><RankBadge rank={MAGNUS_RANK} /></div>
          <p style={{ flex: 1, fontFamily: P.serif, fontStyle: 'italic', fontSize: 12.5, color: P.ink2, margin: 0 }}>Top 20 at this gym</p>
        </div>
      </Card>

      {/* Points per grade */}
      <Eyebrow style={{ marginBottom: 12 }}>Points per grade</Eyebrow>
      <Card style={{ overflow: 'hidden' }}>
        {GRADE_POINTS.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i ? `1px solid ${P.line}` : 'none' }}>
            <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13.5, color: P.ink, width: 78 }}>{t.label}</span>
            <div style={{ flex: 1, height: 7, background: P.lineSoft, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round((t.points / 150) * 100)}%`, background: P.primary, borderRadius: 999 }} />
            </div>
            <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 12.5, color: P.ink, width: 52, textAlign: 'right' }}>{t.points} pts</span>
          </div>
        ))}
      </Card>
    </PageShell>
  );
}

export default Leaderboard;
