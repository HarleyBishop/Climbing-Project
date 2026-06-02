import { useState, useEffect } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { PageSkeleton } from '../components/Skeleton';
import { useTheme, HOLD, GRAIN } from '../theme';
import { Card, Btn, Eyebrow, Divider, SectionLabel, GradePills, Stars, Modal, Field, Avatar } from '../components/ui/primitives';
import { getDecodedToken } from '../auth';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function ClimbPage() {
  const P = useTheme();
  const [climb, setClimb] = useState();
  const [gradeVote, setGradeVote] = useState([]);
  const [sends, setSends] = useState([]);
  const [videos, setVideos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showSendModal, setShowSendModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [voteError, setVoteError] = useState(null);

  const [attempts, setAttempts] = useState('');
  const [comment, setComment] = useState('');
  const [stars, setStars] = useState(0);
  const [reviewAttempts, setReviewAttempts] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('access');
  const currentUserId = jwtDecode(token).user_id;
  const decoded = getDecodedToken();
  const username = decoded?.username ?? '';

  const myVote = gradeVote.find(v => v.user === currentUserId);
  const mySend = sends.find(s => s.user === currentUserId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [climbRes, voteRes, reviewRes, videoRes, sendRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/`),
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`),
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`),
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`),
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`),
        ]);
        setClimb(climbRes.data);
        setGradeVote(voteRes.data);
        setReviews(reviewRes.data);
        setVideos(videoRes.data);
        setSends(sendRes.data);
      } catch { setError('Failed to load climb. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [gymId, wallId, climbId]);

  const handleVote = async (grade) => {
    setVoteError(null);
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`, { grade });
      const res = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/votes/`);
      setGradeVote(res.data);
    } catch { setVoteError("Couldn't save your vote. Please try again."); }
  };

  const handleLogSend = async () => {
    setSendError(null);
    if (!attempts || parseInt(attempts) < 1) { setSendError('Please enter a valid number of attempts.'); return; }
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`, { attempts: parseInt(attempts) });
      const res = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/sends/`);
      setSends(res.data);
      setAttempts('');
      setShowSendModal(false);
    } catch { setSendError("Couldn't log your send. Please try again."); }
  };

  const handleReview = async () => {
    setReviewError(null);
    if (!comment.trim()) { setReviewError('Please write a comment.'); return; }
    if (stars === 0) { setReviewError('Please select a star rating.'); return; }
    if (!reviewAttempts || parseInt(reviewAttempts) < 1) { setReviewError('Please enter a valid number of attempts.'); return; }
    try {
      await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`, { comment, stars, attempts: parseInt(reviewAttempts) });
      if (videoUrl) {
        await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`, { video_url: videoUrl });
        const vidRes = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/videos/`);
        setVideos(vidRes.data);
      }
      const revRes = await api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}/reviews/`);
      setReviews(revRes.data);
      setComment(''); setStars(0); setReviewAttempts(''); setVideoUrl('');
      setShowReviewModal(false);
    } catch { setReviewError("Couldn't submit your review. Please try again."); }
  };

  if (loading) return <PageSkeleton />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <Btn onClick={() => window.location.reload()}>Retry</Btn>
      </div>
    </div>
  );

  const hold = HOLD[climb.colour] || '#cd6f3f';

  return (
    <div style={{ minHeight: '100vh', background: P.sheet }}>
      {/* Full-bleed colour hero using the climb's hold colour */}
      <div style={{ position: 'relative', minHeight: 192, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(165deg, ${hold} 0%, ${hold} 55%, rgba(0,0,0,.18) 130%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 70% at 75% 12%, rgba(255,255,255,.3), transparent 60%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.13, mixBlendMode: 'soft-light' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto', padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => navigate(`/gym/${gymId}`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.body, fontWeight: 600, fontSize: 13.5, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 17 }}>‹</span> {climb.wall_name}
            </button>
            <Avatar name={username} size={30} onClick={() => navigate('/profile')} />
          </div>
          <div style={{ marginTop: 30, paddingBottom: 30 }}>
            <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.85)', margin: '0 0 7px' }}>
              {climb.colour} hold · {climb.wall_name}
            </p>
            <h1 style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 34, lineHeight: 1, margin: 0, color: '#fff', textShadow: '0 2px 14px rgba(0,0,0,.22)' }}>{climb.name}</h1>
            <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14.5, color: 'rgba(255,255,255,.92)', margin: '8px 0 0' }}>
              Set by @{climb.added_by} · {new Date(climb.set_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* Cream sheet */}
      <div style={{ position: 'relative', marginTop: -20, background: P.sheet, borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 24px rgba(40,40,30,.10)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 20px 40px' }}>

          {/* Stats row */}
          <div style={{ display: 'flex', border: `1px solid ${P.line}`, borderRadius: 14, background: P.card, padding: '14px 0', marginBottom: 16 }}>
            {[
              { v: `V${climb.suggested_grade}`, l: 'Setter' },
              { v: climb.community_grade ? `V${climb.community_grade}` : '—', l: 'Community' },
              { v: sends.length, l: 'Sends' },
              { v: reviews.length, l: 'Reviews' },
            ].map((s, i) => (
              <div key={s.l} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? `1px solid ${P.line}` : 'none', padding: '0 4px' }}>
                <p style={{ fontFamily: P.disp, fontWeight: 400, fontSize: 23, margin: 0, color: P.ink, lineHeight: 1 }}>{s.v}</p>
                <p style={{ fontFamily: P.body, fontWeight: 600, fontSize: 9.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.ink2, margin: '5px 0 0' }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Send strip */}
          {mySend ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: P.goodBg, borderColor: 'transparent', marginBottom: 16 }}>
              <span style={{ color: P.good, fontSize: 17 }}>✓</span>
              <p style={{ flex: 1, fontFamily: P.serif, fontStyle: 'italic', fontSize: 14.5, color: P.good, margin: 0 }}>
                You sent this! <strong style={{ fontStyle: 'normal', fontFamily: P.body, fontWeight: 700 }}>{mySend.attempts} attempts</strong>
              </p>
              <Btn size="sm" variant="ghost" onClick={() => setShowSendModal(true)}>Edit</Btn>
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', marginBottom: 16 }}>
              <p style={{ flex: 1, fontFamily: P.serif, fontStyle: 'italic', fontSize: 15, color: P.ink, margin: 0 }}>Logged your send yet?</p>
              <Btn size="sm" onClick={() => setShowSendModal(true)}>Log send</Btn>
            </Card>
          )}

          {/* Grade vote */}
          <SectionLabel style={{ margin: '24px 0 10px' }}>Vote the grade</SectionLabel>
          {voteError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, margin: '0 0 8px' }}>{voteError}</p>}
          <GradePills grades={GRADES} value={myVote?.grade ?? null} onPick={handleVote} />
          <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink3, margin: '10px 0 0' }}>
            {myVote !== undefined ? `You voted V${myVote.grade}. Community sits at V${climb.community_grade || climb.suggested_grade}.` : 'Tap a grade to add your vote.'}
          </p>

          <Divider m={24} />

          {/* Videos */}
          <SectionLabel>Beta videos · {videos.length}</SectionLabel>
          <div style={{ display: 'flex', gap: 11, flexWrap: 'wrap', marginBottom: 24 }}>
            {videos.map(video => (
              <video key={video.id} width="180" height="120" controls style={{ borderRadius: 12, border: `1px solid ${P.line}` }}>
                <source src={video.video_url} type="video/mp4" />
              </video>
            ))}
            {videos.length === 0 && (
              <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No videos yet.</p>
            )}
          </div>

          <Divider m={4} />

          {/* Reviews */}
          <SectionLabel style={{ margin: '24px 0 12px' }}>Reviews · {reviews.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
            {reviews.map((rv, i) => (
              <div key={rv.id} style={{ borderBottom: i < reviews.length - 1 ? `1px solid ${P.line}` : 'none', paddingBottom: i < reviews.length - 1 ? 18 : 0 }}>
                <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 16.5, lineHeight: 1.4, color: P.ink, margin: 0 }}>"{rv.comment}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                  <Avatar name={rv.username} size={26} />
                  <span style={{ fontFamily: P.body, fontWeight: 600, fontSize: 12.5, color: P.ink }}>@{rv.username}</span>
                  <Stars n={rv.stars} />
                  <span style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink2, marginLeft: 'auto' }}>{rv.attempts} attempts</span>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>No reviews yet.</p>
            )}
          </div>
          <Btn full variant="ghost" onClick={() => setShowReviewModal(true)}>+ Write a review</Btn>
        </div>
      </div>

      {/* Log send modal */}
      {showSendModal && (
        <Modal title="Log your send" subtitle="How many attempts did it take?" onClose={() => { setShowSendModal(false); setSendError(null); }}>
          {sendError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, marginBottom: 10 }}>{sendError}</p>}
          <Field label="Attempts" value={attempts} onChange={setAttempts} placeholder="e.g. 5" type="number" />
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn full onClick={handleLogSend}>Log send</Btn>
            <Btn full variant="ghost" onClick={() => { setShowSendModal(false); setSendError(null); }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Write review modal */}
      {showReviewModal && (
        <Modal title="Write a review" subtitle="Share your beta on this climb" onClose={() => { setShowReviewModal(false); setReviewError(null); }}>
          {reviewError && <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 13, marginBottom: 10 }}>{reviewError}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Comment" value={comment} onChange={setComment} placeholder="What did you think?" textarea />
            <div>
              <p style={{ fontFamily: P.body, fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: P.ink2, marginBottom: 8 }}>Stars</p>
              <Stars n={stars} size={26} onPick={setStars} />
            </div>
            <Field label="Attempts" value={reviewAttempts} onChange={setReviewAttempts} placeholder="e.g. 3" type="number" />
            <Field label="Video URL" optional value={videoUrl} onChange={setVideoUrl} placeholder="https://…" />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn full onClick={handleReview}>Submit</Btn>
              <Btn full variant="ghost" onClick={() => { setShowReviewModal(false); setReviewError(null); }}>Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ClimbPage;
