import { useState } from 'react';
import api from '../../api';
import { Btn, Field, GradePills, Modal, Stars, Toggle, ErrorText } from '../ui/primitives';
import { VideoPicker } from '../VideoPicker';
import { uploadClimbVideo } from '../../lib/videoUpload';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function Section({ label, hint, children }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}{hint && <span className="font-normal text-faint"> · {hint}</span>}
      </span>
      {children}
    </div>
  );
}

/**
 * One sheet for everything a climber records about a climb: the send, their
 * grade vote, a rating + notes, and a beta video. These are still separate
 * rows in the API (Send, GradeVote, Review, Video); this form diffs the
 * fields against `mine` and only creates, updates or deletes what changed.
 *
 *   mine    — the current user's existing { send, vote, review } (any may be undefined)
 *   onSaved — refetch the climb page's data; awaited so `mine` is fresh
 */
export function LogClimbModal({ base, climbName, mine, onSaved, onClose }) {
  const [sent, setSent] = useState(mine.send ? true : !mine.vote && !mine.review);
  const [attempts, setAttempts] = useState(mine.send ? String(mine.send.attempts) : '');
  const [grade, setGrade] = useState(mine.vote?.grade ?? null);
  const [stars, setStars] = useState(mine.review?.stars ?? 0);
  const [comment, setComment] = useState(mine.review?.comment ?? '');
  const [video, setVideo] = useState(null);
  const [videoTitle, setVideoTitle] = useState('');

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  // Set once the send/vote/review are saved. If only the video upload then
  // fails, the retry skips straight to the upload.
  const [logSaved, setLogSaved] = useState(false);

  const isEdit = Boolean(mine.send || mine.vote || mine.review);

  // Each returns a request promise, or null when that part is unchanged.
  const syncSend = () => {
    if (sent) {
      const n = parseInt(attempts);
      return n === mine.send?.attempts ? null : api.post(`${base}/sends/`, { attempts: n });
    }
    return mine.send ? api.delete(`${base}/sends/${mine.send.id}/`) : null;
  };

  const syncVote = () => {
    if (grade === (mine.vote?.grade ?? null)) return null;
    // POST upserts, so changing a vote is the same call as casting one.
    return grade === null
      ? api.delete(`${base}/votes/${mine.vote.id}/`)
      : api.post(`${base}/votes/`, { grade });
  };

  const syncReview = () => {
    if (!stars) return mine.review ? api.delete(`${base}/reviews/${mine.review.id}/`) : null;
    const body = { stars, comment: comment.trim(), attempts: sent ? parseInt(attempts) : 1 };
    if (mine.review && body.stars === mine.review.stars && body.comment === mine.review.comment) return null;
    // Reviews aren't unique per user, so edit the existing one rather than
    // POSTing a second.
    return mine.review
      ? api.patch(`${base}/reviews/${mine.review.id}/`, body)
      : api.post(`${base}/reviews/`, body);
  };

  const handleSave = async () => {
    setError(null);
    if (!logSaved) {
      if (sent && !(parseInt(attempts) >= 1)) { setError('Enter how many attempts it took.'); return; }
      if (comment.trim() && !stars) { setError('Add a star rating to go with your notes.'); return; }
      if (!sent && grade === null && !stars && !video && !isEdit) {
        setError('Log a send, a grade, a rating or a video.');
        return;
      }
    }

    setSaving(true);
    if (!logSaved) {
      try {
        // The three parts are independent rows, so save them in parallel.
        await Promise.all([syncSend(), syncVote(), syncReview()]);
        await onSaved();
        setLogSaved(true);
      } catch {
        setError("Couldn't save your log. Please try again.");
        setSaving(false);
        return;
      }
    }

    if (video) {
      try {
        setProgress(0);
        await uploadClimbVideo(base, video, videoTitle, setProgress);
        await onSaved();
      } catch (err) {
        setError(err.response?.data?.detail || 'Your log is saved, but the video upload failed. Retry, or skip the video.');
        setProgress(null);
        setSaving(false);
        return;
      }
    }
    onClose();
  };

  const saveLabel = () => {
    if (progress !== null) return `Uploading… ${progress}%`;
    if (saving) return 'Saving…';
    if (logSaved) return 'Retry upload';
    return 'Save';
  };

  return (
    <Modal title={isEdit ? 'Edit your log' : 'Log this climb'} subtitle={climbName} onClose={() => !saving && onClose()}>
      {error && <ErrorText>{error}</ErrorText>}

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4">
        <div>
          <p className="font-medium">{sent ? 'Sent it' : 'Still projecting'}</p>
          <p className="text-sm text-muted">{sent ? 'Nice. How many goes?' : 'You can still grade, rate and share beta.'}</p>
        </div>
        <Toggle on={sent} onChange={setSent} />
      </div>
      {sent && (
        <Field label="Attempts" value={attempts} onChange={setAttempts} placeholder="e.g. 3" type="number" hint="1 attempt = flash" />
      )}

      <Section label="Your grade" hint="optional">
        {/* Tapping the selected grade again clears the vote. */}
        <GradePills grades={GRADES} value={grade} onPick={g => setGrade(g === grade ? null : g)} />
      </Section>

      <Section label="Rating" hint="optional">
        <div className="flex items-center gap-3">
          <Stars n={stars} size={28} onPick={s => setStars(s === stars ? 0 : s)} />
          {stars > 0 && <span className="text-sm text-muted">Tap again to clear</span>}
        </div>
      </Section>

      <Field label="Notes & beta" optional value={comment} onChange={setComment} placeholder="What did you think? Any tips for the crux?" textarea />

      <VideoPicker
        file={video} onChange={setVideo} onError={setError}
        title={videoTitle} onTitleChange={setVideoTitle}
        progress={progress} locked={saving}
      />

      <div className="flex gap-3">
        <Btn full variant="ghost" onClick={onClose} disabled={saving}>{logSaved ? 'Skip video' : 'Cancel'}</Btn>
        <Btn full onClick={handleSave} disabled={saving}>{saveLabel()}</Btn>
      </div>
    </Modal>
  );
}
