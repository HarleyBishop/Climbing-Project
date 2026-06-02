import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, calculatePoints, RankBadge } from '../utils/rankUtils';
import { Card, Chip, SectionLabel, Divider, Stars } from '../components/ui/primitives';
import { useTheme, HOLD } from '../theme';

function Profile() {
  const P = useTheme();
  const { userId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('access');
  const currentUserId = jwtDecode(token).user_id;
  const profileId = userId || currentUserId;

  const [profile, setProfile] = useState(null);
  const [sends, setSends] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, sendsRes, reviewsRes, videosRes] = await Promise.all([
          api.get(`/api/users/${profileId}/`),
          api.get(`/api/users/${profileId}/sends/`),
          api.get(`/api/users/${profileId}/reviews/`),
          api.get(`/api/users/${profileId}/videos/`),
        ]);
        setProfile(profileRes.data);
        setSends(sendsRes.data);
        setReviews(reviewsRes.data);
        setVideos(videosRes.data);
      } catch { setError('Failed to load profile. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [profileId]);

  const totalPoints = calculatePoints(sends);
  const userRank = getRank(totalPoints);

  const avgGrade = sends.length
    ? Math.round(sends.reduce((sum, s) => sum + s.climb_grade, 0) / sends.length)
    : null;

  const homeGym = sends.length
    ? Object.entries(sends.reduce((acc, s) => { acc[s.gym_name] = (acc[s.gym_name] || 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  if (loading) return <PageSkeleton />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const isOwnProfile = parseInt(profileId) === currentUserId;

  const headerRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
      <RankBadge rank={userRank} />
      <span style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13, color: P.skyText }}>{totalPoints.toLocaleString()} pts</span>
      <span style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.skyText, opacity: .85 }}>
        · since {new Date(profile.date_joined).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
      </span>
    </div>
  );

  return (
    <PageShell back backLabel="Back" eyebrow={isOwnProfile ? 'Your profile' : 'Profile'} title={`@${profile.username}`} right={headerRight} heroHeight={176}>

      {/* Home gym */}
      {homeGym && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', marginBottom: 20 }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: P.accent, flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.ink2, margin: '0 0 2px' }}>Home gym</p>
            <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 17, margin: 0, color: P.ink }}>{homeGym}</p>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { v: sends.length, l: 'Sends' },
          { v: reviews.length, l: 'Reviews' },
          { v: videos.length, l: 'Videos' },
          { v: avgGrade !== null ? `V${avgGrade}` : '—', l: 'Avg' },
        ].map(s => (
          <div key={s.l} style={{ background: P.card, border: `1px solid ${P.line}`, borderRadius: 13, padding: '12px 6px', textAlign: 'center' }}>
            <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 22, margin: 0, color: P.ink, lineHeight: 1 }}>{s.v}</p>
            <p style={{ fontFamily: P.body, fontWeight: 600, fontSize: 9.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.ink2, margin: '5px 0 0' }}>{s.l}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Sends */}
      <SectionLabel>Sends · {sends.length}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {sends.map(send => (
          <Card key={send.id} hover onClick={() => navigate(`/gym/${send.gym_id}/wall/${send.wall_id}/climb/${send.climb_id}`)} style={{ display: 'flex', overflow: 'hidden', alignItems: 'stretch' }}>
            <div style={{ width: 7, background: HOLD[send.climb_colour] || '#cd6f3f', flexShrink: 0 }} />
            <div style={{ flex: 1, padding: '11px 14px', minWidth: 0 }}>
              <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 16, margin: 0, color: P.ink, lineHeight: 1.1 }}>{send.climb_name}</p>
              <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: '3px 0 0' }}>{send.wall_name} · {send.gym_name}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 4, padding: '0 14px' }}>
              <Chip tone="accent">V{send.climb_grade}</Chip>
              <span style={{ fontFamily: P.body, fontSize: 11, color: P.ink2 }}>{send.attempts} att.</span>
            </div>
          </Card>
        ))}
        {sends.length === 0 && <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No sends logged yet.</p>}
      </div>

      <Divider />

      {/* Reviews */}
      <SectionLabel>Reviews · {reviews.length}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {reviews.map(rv => (
          <Card key={rv.id} style={{ padding: '13px 15px' }} hover onClick={() => navigate(`/gym/${rv.gym_id}/wall/${rv.wall_id}/climb/${rv.climb_id}`)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 16, margin: 0, color: P.ink }}>{rv.climb_name}</p>
              <Stars n={rv.stars} />
            </div>
            <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14.5, lineHeight: 1.4, color: P.ink, margin: '0 0 6px' }}>"{rv.comment}"</p>
            <p style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, margin: 0 }}>{rv.wall_name} · {rv.gym_name}</p>
          </Card>
        ))}
        {reviews.length === 0 && <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No reviews yet.</p>}
      </div>

      <Divider />

      {/* Videos */}
      <SectionLabel>Videos · {videos.length}</SectionLabel>
      <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap' }}>
        {videos.map(video => (
          <video key={video.id} width="180" height="120" controls style={{ borderRadius: 12, border: `1px solid ${P.line}` }}>
            <source src={video.video_url} type="video/mp4" />
          </video>
        ))}
        {videos.length === 0 && <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No videos yet.</p>}
      </div>
    </PageShell>
  );
}

export default Profile;
