import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getDecodedToken } from '../auth';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { holdColour } from '../lib/holds';
import { Card, Btn, SectionLabel, GradePills, Stars, Modal, Field, Avatar, Empty, ErrorText, ErrorScreen } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';
import { NumberTicker } from '../components/magicui/number-ticker';
import { VideoPicker } from '../components/VideoPicker';
import { uploadClimbVideo } from '../lib/videoUpload';

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
  const [video, setVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  // Reviews aren't unique per user, so if the review saves but the video
  // upload fails, the retry must skip re-posting the review.
  const [reviewSaved, setReviewSaved] = useState(false);

  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();
  const base = `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}`;

  const currentUserId = getDecodedToken()?.user_id;
  const myVote = gradeVote.find(v => v.user === currentUserId);
  const mySend = sends.find(s => s.user === currentUserId);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [climbRes, voteRes, reviewRes, videoRes, sendRes] = await Promise.all([
          api.get(`${base}/`),
          api.get(`${base}/votes/`),
          api.get(`${base}/reviews/`),
          api.get(`${base}/videos/`),
          api.get(`${base}/sends/`),
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
  }, [base]);

  const handleVote = async (grade) => {
    setVoteError(null);
    try {
      await api.post(`${base}/votes/`, { grade });
      const [voteRes, climbRes] = await Promise.all([api.get(`${base}/votes/`), api.get(`${base}/`)]);
      setGradeVote(voteRes.data);
      setClimb(climbRes.data);
    } catch { setVoteError("Couldn't save your vote. Please try again."); }
  };

  const handleLogSend = async () => {
    setSendError(null);
    if (!attempts || parseInt(attempts) < 1) { setSendError('Please enter a valid number of attempts.'); return; }
    try {
      await api.post(`${base}/sends/`, { attempts: parseInt(attempts) });
      const res = await api.get(`${base}/sends/`);
      setSends(res.data);
      setAttempts('');
      setShowSendModal(false);
    } catch { setSendError("Couldn't log your send. Please try again."); }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setReviewError(null);
    // A saved review is already on the page, so drop its form state rather
    // than leaving it to be submitted again next time the modal opens.
    if (reviewSaved) {
      setComment(''); setStars(0); setReviewAttempts(''); setVideo(null); setReviewSaved(false);
    }
  };

  const handleReview = async () => {
    setReviewError(null);
    if (!reviewSaved) {
      if (!comment.trim()) { setReviewError('Please write a comment.'); return; }
      if (stars === 0) { setReviewError('Please select a star rating.'); return; }
      if (!reviewAttempts || parseInt(reviewAttempts) < 1) { setReviewError('Please enter a valid number of attempts.'); return; }
    }
    setSubmittingReview(true);
    try {
      if (!reviewSaved) {
        await api.post(`${base}/reviews/`, { comment, stars, attempts: parseInt(reviewAttempts) });
        setReviewSaved(true);
        setReviews((await api.get(`${base}/reviews/`)).data);
      }
    } catch {
      setReviewError("Couldn't submit your review. Please try again.");
      setSubmittingReview(false);
      return;
    }

    if (video) {
      try {
        setUploadProgress(0);
        await uploadClimbVideo(base, video, setUploadProgress);
        setVideos((await api.get(`${base}/videos/`)).data);
      } catch (err) {
        setReviewError(err.response?.data?.detail || 'Review posted, but the video upload failed. Try again or remove the video.');
        setUploadProgress(null);
        setSubmittingReview(false);
        return;
      }
    }
    setComment(''); setStars(0); setReviewAttempts(''); setVideo(null);
    setReviewSaved(false); setUploadProgress(null); setSubmittingReview(false);
    setShowReviewModal(false);
  };

  const reviewSubmitLabel = () => {
    if (uploadProgress !== null) return `Uploading… ${uploadProgress}%`;
    if (submittingReview) return 'Submitting…';
    if (reviewSaved) return video ? 'Retry video upload' : 'Done';
    return 'Submit';
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const hold = holdColour(climb.colour);
  const setOn = new Date(climb.set_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  return (
    <PageShell back backLabel={climb.wall_name} backPath={`/gym/${gymId}`}>
      {/* Hero tile in the climb's hold colour (or its photo). */}
      <div
        className="relative -mt-6 overflow-hidden rounded-[2rem] p-8 text-white sm:p-10"
        style={{ background: climb.image_url ? undefined : `radial-gradient(120% 100% at 85% 0%, rgba(255,255,255,.35), transparent 50%), ${hold}` }}
      >
        {climb.image_url && (
          <>
            <img src={climb.image_url} alt="" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-black/10" />
          </>
        )}
        <div className="relative pt-16 sm:pt-24 [text-shadow:0_1px_12px_rgba(0,0,0,.2)]">
          <p className="text-sm font-semibold opacity-90">{climb.colour} · {climb.wall_name}</p>
          <h1 className="mt-1 text-5xl font-semibold sm:text-6xl">{climb.name}</h1>
          <p className="mt-3 opacity-90">
            Set by{' '}
            <button onClick={() => navigate(`/profile/${climb.added_by}`)} className="cursor-pointer underline underline-offset-4">
              @{climb.added_by_username}
            </button>
            {' · '}{setOn}
          </p>
        </div>
      </div>

      {/* Stats count up as they appear. */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {[
          { v: climb.suggested_grade, prefix: 'V', l: 'Setter grade' },
          { v: climb.community_grade, prefix: 'V', l: 'Community', decimals: 1 },
          { v: sends.length, l: 'Sends' },
          { v: reviews.length, l: 'Reviews' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl bg-white py-5 text-center ring-1 ring-line/60">
            <p className="text-2xl font-semibold sm:text-3xl">
              {s.v == null ? '—' : <>{s.prefix}<NumberTicker value={s.v} decimalPlaces={s.v % 1 ? s.decimals ?? 0 : 0} /></>}
            </p>
            <p className="mt-1 text-xs text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4 flex items-center gap-4 p-5">
        {mySend ? (
          <>
            <span className="flex size-9 items-center justify-center rounded-full bg-good-soft text-good">✓</span>
            <p className="flex-1">You sent this in <strong>{mySend.attempts} attempts</strong>.</p>
            <Btn size="sm" variant="ghost" onClick={() => setShowSendModal(true)}>Edit</Btn>
          </>
        ) : (
          <>
            <p className="flex-1 text-lg font-medium">Sent it?</p>
            <Btn size="sm" variant="accent" onClick={() => setShowSendModal(true)}>Log send</Btn>
          </>
        )}
      </Card>

      <BlurFade inView className="mt-16">
        <SectionLabel>Vote the grade</SectionLabel>
        {voteError && <ErrorText>{voteError}</ErrorText>}
        <GradePills grades={GRADES} value={myVote?.grade ?? null} onPick={handleVote} />
        <p className="mt-3 text-sm text-muted">
          {myVote ? `You voted V${myVote.grade}. Community sits at V${climb.community_grade ?? climb.suggested_grade}.` : 'Tap a grade to add your vote.'}
        </p>
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel right={videos.length}>Beta videos</SectionLabel>
        {videos.length === 0 ? <Empty>No videos yet.</Empty> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map(video => (
              <video key={video.id} src={video.video_url} controls className="aspect-video w-full rounded-2xl bg-black" />
            ))}
          </div>
        )}
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel right={reviews.length}>Reviews</SectionLabel>
        <div className="space-y-3">
          {reviews.map(rv => (
            <Card key={rv.id} className="p-6">
              <p className="text-lg leading-snug">“{rv.comment}”</p>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={() => navigate(`/profile/${rv.user}`)} className="flex cursor-pointer items-center gap-2">
                  <Avatar name={rv.username} size={28} />
                  <span className="text-sm font-medium">@{rv.username}</span>
                </button>
                <Stars n={rv.stars} />
                <span className="ml-auto text-xs text-muted">{rv.attempts} attempts</span>
              </div>
            </Card>
          ))}
          {reviews.length === 0 && <Empty>No reviews yet.</Empty>}
        </div>
        <Btn full variant="ghost" className="mt-4" onClick={() => setShowReviewModal(true)}>Write a review</Btn>
      </BlurFade>

      {showSendModal && (
        <Modal title="Log your send" subtitle="How many attempts did it take?" onClose={() => { setShowSendModal(false); setSendError(null); }}>
          {sendError && <ErrorText>{sendError}</ErrorText>}
          <Field label="Attempts" value={attempts} onChange={setAttempts} placeholder="e.g. 5" type="number" />
          <div className="flex gap-3">
            <Btn full variant="ghost" onClick={() => { setShowSendModal(false); setSendError(null); }}>Cancel</Btn>
            <Btn full onClick={handleLogSend}>Log send</Btn>
          </div>
        </Modal>
      )}

      {showReviewModal && (
        <Modal title="Write a review" subtitle="Share your beta on this climb" onClose={() => !submittingReview && closeReviewModal()}>
          {reviewError && <ErrorText>{reviewError}</ErrorText>}
          <Field label="Comment" value={comment} onChange={setComment} placeholder="What did you think?" textarea />
          <div>
            <span className="mb-1.5 block text-sm font-medium">Rating</span>
            <Stars n={stars} size={28} onPick={setStars} />
          </div>
          <Field label="Attempts" value={reviewAttempts} onChange={setReviewAttempts} placeholder="e.g. 3" type="number" />
          <VideoPicker file={video} onChange={setVideo} onError={setReviewError} progress={uploadProgress} locked={submittingReview} />
          <div className="flex gap-3">
            <Btn full variant="ghost" onClick={closeReviewModal} disabled={submittingReview}>{reviewSaved ? 'Skip video' : 'Cancel'}</Btn>
            <Btn full onClick={handleReview} disabled={submittingReview}>{reviewSubmitLabel()}</Btn>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

export default ClimbPage;
