import { useState, useEffect } from 'react';
import api from '../api';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { PageSkeleton } from '../components/Skeleton';
import { HOLD, GRAIN } from '../theme';
import { Card, Btn, Eyebrow, Divider, SectionLabel, GradePills, Stars, Modal, Field, Avatar, ErrorScreen } from '../components/ui/primitives';
import { getDecodedToken } from '../auth';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function ClimbPage() {
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
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const hold = HOLD[climb.colour] || '#cd6f3f';

  return (
    <div className="min-h-screen bg-sheet">
      {/* Full-bleed colour hero using the climb's hold colour */}
      <div className="relative overflow-hidden" style={{ minHeight: 192 }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(165deg, ${hold} 0%, ${hold} 55%, rgba(0,0,0,.18) 130%)` }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(90% 70% at 75% 12%, rgba(255,255,255,.3), transparent 60%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: GRAIN, backgroundSize: '160px 160px', opacity: 0.13, mixBlendMode: 'soft-light' }} />
        <div className="relative max-w-[640px] mx-auto px-5 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/gym/${gymId}`)}
              className="bg-transparent border-0 cursor-pointer font-body font-semibold text-[13.5px] text-white inline-flex items-center gap-1"
            >
              <span className="text-[17px]">‹</span> {climb.wall_name}
            </button>
            <Avatar name={username} size={30} onClick={() => navigate('/profile')} />
          </div>
          <div className="mt-[30px] pb-[30px]">
            <p className="font-body font-bold text-[10.5px] tracking-[0.16em] uppercase m-0 mb-[7px]" style={{ color: 'rgba(255,255,255,.85)' }}>
              {climb.colour} hold · {climb.wall_name}
            </p>
            <h1 className="font-display font-normal text-[34px] leading-none m-0 text-white" style={{ textShadow: '0 2px 14px rgba(0,0,0,.22)' }}>{climb.name}</h1>
            <p className="font-serif italic text-[14.5px] mt-2 mb-0" style={{ color: 'rgba(255,255,255,.92)' }}>
              Set by{' '}
              <button
                onClick={() => navigate(`/profile/${climb.added_by}`)}
                className="bg-transparent border-0 p-0 cursor-pointer font-serif italic text-[14.5px] underline underline-offset-[3px]"
                style={{ color: 'rgba(255,255,255,.92)' }}
              >
                @{climb.added_by_username}
              </button>
              {' · '}{new Date(climb.set_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      {/* Cream sheet */}
      <div className="relative -mt-5 bg-sheet rounded-[22px_22px_0_0] shadow-[0_-8px_24px_rgba(40,40,30,.10)]">
        <div className="max-w-[640px] mx-auto px-5 pt-5 pb-10">

          {/* Stats row */}
          <div className="flex border border-line rounded-[14px] bg-card px-0 py-[14px] mb-4">
            {[
              { v: `V${climb.suggested_grade}`, l: 'Setter' },
              { v: climb.community_grade ? `V${climb.community_grade}` : '—', l: 'Community' },
              { v: sends.length, l: 'Sends' },
              { v: reviews.length, l: 'Reviews' },
            ].map((s, i) => (
              <div key={s.l} className="flex-1 text-center px-1" style={{ borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                <p className="font-display font-normal text-[23px] m-0 text-ink leading-none">{s.v}</p>
                <p className="font-body font-semibold text-[9.5px] tracking-[0.08em] uppercase text-ink2 mt-[5px] mb-0">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Send strip */}
          {mySend ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', background: 'var(--good-bg)', borderColor: 'transparent', marginBottom: 16 }}>
              <span className="text-good text-[17px]">✓</span>
              <p className="flex-1 font-serif italic text-[14.5px] text-good m-0">
                You sent this! <strong className="not-italic font-body font-bold">{mySend.attempts} attempts</strong>
              </p>
              <Btn size="sm" variant="ghost" onClick={() => setShowSendModal(true)}>Edit</Btn>
            </Card>
          ) : (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', marginBottom: 16 }}>
              <p className="flex-1 font-serif italic text-[15px] text-ink m-0">Logged your send yet?</p>
              <Btn size="sm" onClick={() => setShowSendModal(true)}>Log send</Btn>
            </Card>
          )}

          {/* Grade vote */}
          <SectionLabel style={{ margin: '24px 0 10px' }}>Vote the grade</SectionLabel>
          {voteError && <p className="font-serif italic text-danger text-[13px] m-0 mb-2">{voteError}</p>}
          <GradePills grades={GRADES} value={myVote?.grade ?? null} onPick={handleVote} />
          <p className="font-serif italic text-[13px] text-ink3 mt-[10px] mb-0">
            {myVote !== undefined ? `You voted V${myVote.grade}. Community sits at V${climb.community_grade || climb.suggested_grade}.` : 'Tap a grade to add your vote.'}
          </p>

          <Divider m={24} />

          {/* Videos */}
          <SectionLabel>Beta videos · {videos.length}</SectionLabel>
          <div className="flex gap-[11px] flex-wrap mb-6">
            {videos.map(video => (
              <video key={video.id} width="180" height="120" controls className="rounded-[12px] border border-line">
                <source src={video.video_url} type="video/mp4" />
              </video>
            ))}
            {videos.length === 0 && (
              <p className="font-serif italic text-sm text-ink3">No videos yet.</p>
            )}
          </div>

          <Divider m={4} />

          {/* Reviews */}
          <SectionLabel style={{ margin: '24px 0 12px' }}>Reviews · {reviews.length}</SectionLabel>
          <div className="flex flex-col gap-[18px] mb-5">
            {reviews.map((rv, i) => (
              <div key={rv.id} style={{ borderBottom: i < reviews.length - 1 ? '1px solid var(--line)' : 'none', paddingBottom: i < reviews.length - 1 ? 18 : 0 }}>
                <p className="font-serif italic text-[16.5px] leading-[1.4] text-ink m-0">"{rv.comment}"</p>
                <div className="flex items-center gap-[9px] mt-[11px]">
                  <button
                    onClick={() => navigate(`/profile/${rv.user}`)}
                    className="flex items-center gap-[9px] bg-transparent border-0 p-0 cursor-pointer"
                  >
                    <Avatar name={rv.username} size={26} />
                    <span className="font-body font-semibold text-[12.5px] text-ink">@{rv.username}</span>
                  </button>
                  <Stars n={rv.stars} />
                  <span className="font-body text-[11.5px] text-ink2 ml-auto">{rv.attempts} attempts</span>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="font-serif italic text-sm text-ink3">No reviews yet.</p>
            )}
          </div>
          <Btn full variant="ghost" onClick={() => setShowReviewModal(true)}>+ Write a review</Btn>
        </div>
      </div>

      {showSendModal && (
        <Modal title="Log your send" subtitle="How many attempts did it take?" onClose={() => { setShowSendModal(false); setSendError(null); }}>
          {sendError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{sendError}</p>}
          <Field label="Attempts" value={attempts} onChange={setAttempts} placeholder="e.g. 5" type="number" />
          <div className="flex gap-[10px]">
            <Btn full onClick={handleLogSend}>Log send</Btn>
            <Btn full variant="ghost" onClick={() => { setShowSendModal(false); setSendError(null); }}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {showReviewModal && (
        <Modal title="Write a review" subtitle="Share your beta on this climb" onClose={() => { setShowReviewModal(false); setReviewError(null); }}>
          {reviewError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{reviewError}</p>}
          <div className="flex flex-col gap-[14px]">
            <Field label="Comment" value={comment} onChange={setComment} placeholder="What did you think?" textarea />
            <div>
              <p className="font-body font-bold text-[10px] tracking-[0.14em] uppercase text-ink2 mb-2">Stars</p>
              <Stars n={stars} size={26} onPick={setStars} />
            </div>
            <Field label="Attempts" value={reviewAttempts} onChange={setReviewAttempts} placeholder="e.g. 3" type="number" />
            <Field label="Video URL" optional value={videoUrl} onChange={setVideoUrl} placeholder="https://…" />
            <div className="flex gap-[10px]">
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
