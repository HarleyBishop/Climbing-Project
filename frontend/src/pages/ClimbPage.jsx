import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getDecodedToken } from '../auth';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { holdColour } from '../lib/holds';
import { timeAgo } from '../lib/utils';
import { Card, Btn, Chip, SectionLabel, Stars, Avatar, Empty, ErrorScreen } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';
import { NumberTicker } from '../components/magicui/number-ticker';
import { LogClimbModal } from '../components/ClimbPageComponents/LogClimbModal';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Sends, votes, reviews and videos are separate API resources, but on this
 * page they're one story per climber. Merge them into a log per user, newest
 * activity first. A user can have several reviews, so keep the latest.
 */
function buildLogs({ sends, votes, reviews, videos }) {
  const byUser = new Map();
  const entry = (user, username) => {
    if (!byUser.has(user)) byUser.set(user, { user, username, videos: [], latest: '' });
    return byUser.get(user);
  };
  const touch = (e, at) => { if (at > e.latest) e.latest = at; };

  sends.forEach(s => { const e = entry(s.user, s.username); e.send = s; touch(e, s.sent_at); });
  votes.forEach(v => { const e = entry(v.user, v.username); e.vote = v; touch(e, v.created_at); });
  reviews.forEach(r => {
    const e = entry(r.user, r.username);
    if (!e.review || r.created_at > e.review.created_at) e.review = r;
    touch(e, r.created_at);
  });
  videos.forEach(v => { const e = entry(v.user, v.username); e.videos.push(v); touch(e, v.uploaded_at); });

  return [...byUser.values()].sort((a, b) => b.latest.localeCompare(a.latest));
}

// The chips that summarise one climber's log: sent/projecting, their grade, video count.
function LogChips({ log }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {log.send
        ? <Chip tone="good">{log.send.attempts === 1 ? '⚡ Flashed' : `✓ Sent · ${plural(log.send.attempts, 'attempt')}`}</Chip>
        : <Chip>Projecting</Chip>}
      {log.vote && <Chip tone="info">Graded V{log.vote.grade}</Chip>}
      {log.videos.length > 0 && <Chip tone="accent">▶ {plural(log.videos.length, 'video')}</Chip>}
    </div>
  );
}

function VideoCard({ video, log, isSetter, isMine, onDelete }) {
  const navigate = useNavigate();
  return (
    <Card className="overflow-hidden">
      <video src={video.video_url} controls preload="metadata" className="aspect-video w-full bg-black" />
      <div className="p-4">
        <p className="font-semibold">{video.title || 'Beta video'}</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <button onClick={() => navigate(`/profile/${video.user}`)} className="flex cursor-pointer items-center gap-2">
            <Avatar name={video.username} size={24} />
            <span className="font-medium">@{video.username}</span>
          </button>
          {isSetter && <Chip tone="accent">Setter</Chip>}
          {!isSetter && log?.send && <span className="text-muted">sent in {plural(log.send.attempts, 'attempt')}</span>}
          <span className="ml-auto text-xs text-faint">{timeAgo(video.uploaded_at)}</span>
        </div>
        {isMine && (
          <button onClick={() => onDelete(video)} className="mt-3 cursor-pointer text-sm text-danger hover:underline">Delete video</button>
        )}
      </div>
    </Card>
  );
}

function ClimbPage() {
  const [climb, setClimb] = useState();
  const [activity, setActivity] = useState({ sends: [], votes: [], reviews: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLog, setShowLog] = useState(false);

  const { gymId, wallId, climbId } = useParams();
  const navigate = useNavigate();
  const base = `/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}`;
  const currentUserId = getDecodedToken()?.user_id;

  // Refetched in full after every save: a log touches up to four resources,
  // and the climb itself (community grade) changes with votes.
  const fetchAll = useCallback(async () => {
    const [climbRes, sends, votes, reviews, videos] = await Promise.all([
      api.get(`${base}/`),
      ...['sends', 'votes', 'reviews', 'videos'].map(r => api.get(`${base}/${r}/`)),
    ]);
    setClimb(climbRes.data);
    setActivity({ sends: sends.data, votes: votes.data, reviews: reviews.data, videos: videos.data });
  }, [base]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try { await fetchAll(); }
      catch { setError('Failed to load climb. Please try again.'); }
      finally { setLoading(false); }
    };
    load();
  }, [fetchAll]);

  const handleDeleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title || 'Beta video'}"?`)) return;
    try {
      await api.delete(`${base}/videos/${video.id}/`);
      await fetchAll();
    } catch { window.alert("Couldn't delete the video. Please try again."); }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const logs = buildLogs(activity);
  const myLog = logs.find(l => l.user === currentUserId);
  const logByUser = Object.fromEntries(logs.map(l => [l.user, l]));
  const { sends, reviews, videos } = activity;
  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length : null;
  // Setter beta first, then newest.
  const sortedVideos = [...videos].sort((a, b) =>
    (b.user === climb.added_by) - (a.user === climb.added_by) || b.uploaded_at.localeCompare(a.uploaded_at));

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
          { v: avgRating, suffix: '★', l: 'Rating', decimals: 1 },
        ].map(s => (
          <div key={s.l} className="rounded-2xl bg-white py-5 text-center ring-1 ring-line/60">
            <p className="text-2xl font-semibold sm:text-3xl">
              {s.v == null ? '—' : <>{s.prefix}<NumberTicker value={s.v} decimalPlaces={s.v % 1 ? s.decimals ?? 0 : 0} />{s.suffix}</>}
            </p>
            <p className="mt-1 text-xs text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      {/* The one entry point for logging: send, grade, rating, notes, video. */}
      <Card className="mt-4 p-5">
        {myLog ? (
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <p className="text-sm font-medium text-muted">Your log</p>
              <LogChips log={myLog} />
              {myLog.review && <Stars n={myLog.review.stars} />}
              {myLog.review?.comment && <p className="leading-snug">“{myLog.review.comment}”</p>}
            </div>
            <Btn size="sm" variant="ghost" onClick={() => setShowLog(true)}>Edit</Btn>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-lg font-medium">Sent it, or working on it?</p>
              <p className="text-sm text-muted">Log your attempts, grade it, rate it and share your beta in one go.</p>
            </div>
            <Btn size="sm" variant="accent" onClick={() => setShowLog(true)}>Log climb</Btn>
          </div>
        )}
      </Card>

      <BlurFade inView className="mt-16">
        <SectionLabel right={videos.length}>Beta videos</SectionLabel>
        {videos.length === 0 ? (
          <Empty>No beta yet. Add a video when you log the climb.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedVideos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                log={logByUser[video.user]}
                isSetter={video.user === climb.added_by}
                isMine={video.user === currentUserId}
                onDelete={handleDeleteVideo}
              />
            ))}
          </div>
        )}
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel right={logs.length}>Climber logs</SectionLabel>
        <div className="space-y-3">
          {logs.map(log => (
            <Card key={log.user} className="p-5">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/profile/${log.user}`)} className="flex cursor-pointer items-center gap-2">
                  <Avatar name={log.username} size={32} />
                  <span className="text-sm font-semibold">@{log.username}</span>
                </button>
                {log.review && <Stars n={log.review.stars} />}
                <span className="ml-auto text-xs text-faint">{timeAgo(log.latest)}</span>
              </div>
              {log.review?.comment && <p className="mt-3 text-lg leading-snug">“{log.review.comment}”</p>}
              <div className="mt-3"><LogChips log={log} /></div>
            </Card>
          ))}
          {logs.length === 0 && <Empty>Nobody has logged this climb yet. Be the first.</Empty>}
        </div>
      </BlurFade>

      {showLog && (
        <LogClimbModal
          base={base}
          climbName={climb.name}
          mine={{ send: myLog?.send, vote: myLog?.vote, review: myLog?.review }}
          onSaved={fetchAll}
          onClose={() => setShowLog(false)}
        />
      )}
    </PageShell>
  );
}

export default ClimbPage;
