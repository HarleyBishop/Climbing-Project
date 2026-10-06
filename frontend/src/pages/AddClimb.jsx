import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { Btn, Field, GradePills, ColourSwatches, ErrorText } from '../components/ui/primitives';
import { holdColour } from '../lib/holds';
import { uploadClimbVideo, videoFileError, MAX_VIDEO_MB, VIDEO_TYPES } from '../lib/videoUpload';

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function AddClimb() {
  const { gymId, wallId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [colour, setColour] = useState('Green');
  const [grade, setGrade] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  // Set once the climb is saved. If only the video upload then fails, the
  // next submit retries just the upload instead of creating a second climb.
  const [createdClimbId, setCreatedClimbId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Object URLs keep the file in memory until revoked, so release the old
  // preview whenever the file changes or the page unmounts.
  const videoPreview = useMemo(() => video && URL.createObjectURL(video), [video]);
  useEffect(() => () => videoPreview && URL.revokeObjectURL(videoPreview), [videoPreview]);

  const handleVideoPick = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // lets the same file be re-picked after removing it
    if (!file) return;
    const problem = videoFileError(file);
    setError(problem);
    if (!problem) setVideo(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (grade === null) { setError('Please select a grade.'); return; }
    setLoading(true);
    let climbId = createdClimbId;
    try {
      if (!climbId) {
        const res = await api.post(`/api/gyms/${gymId}/walls/${wallId}/climbs/`, {
          name, colour, suggested_grade: grade, image_url: imageUrl,
        });
        climbId = res.data.id;
        setCreatedClimbId(climbId);
      }
    } catch {
      setError('Failed to add climb. Please try again.');
      setLoading(false);
      return;
    }

    if (video) {
      try {
        setUploadProgress(0);
        await uploadClimbVideo(`/api/gyms/${gymId}/walls/${wallId}/climbs/${climbId}`, video, setUploadProgress);
      } catch (err) {
        setError(err.response?.data?.detail || 'Climb added, but the video upload failed. Try again or remove the video.');
        setUploadProgress(null);
        setLoading(false);
        return;
      }
    }
    navigate(`/gym/${gymId}`);
  };

  const submitLabel = () => {
    if (uploadProgress !== null) return `Uploading video… ${uploadProgress}%`;
    if (loading) return 'Adding…';
    if (createdClimbId) return video ? 'Retry video upload' : 'Done';
    return 'Add climb';
  };

  return (
    <PageShell back backLabel="Back to gym" backPath={`/gym/${gymId}`} eyebrow="New climb" title="Add a climb">
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <ErrorText>{error}</ErrorText>}

        {/* Live preview tile, same look as the climb cards. */}
        <div
          className="flex h-40 items-end rounded-3xl p-6 text-white transition-colors duration-300"
          style={{ background: `radial-gradient(120% 100% at 85% 0%, rgba(255,255,255,.35), transparent 50%), ${holdColour(colour)}` }}
        >
          <div className="[text-shadow:0_1px_10px_rgba(0,0,0,.2)]">
            <p className="text-sm font-semibold opacity-90">{colour}{grade !== null && ` · V${grade}`}</p>
            <p className="text-3xl font-semibold tracking-tight">{name || 'Untitled climb'}</p>
          </div>
        </div>

        <Field label="Climb name" value={name} onChange={setName} placeholder="e.g. Crimpy arête" />

        <div>
          <span className="mb-3 block text-sm font-medium">Hold colour</span>
          <ColourSwatches value={colour} onPick={setColour} />
        </div>

        <div>
          <span className="mb-3 block text-sm font-medium">Setter grade</span>
          <GradePills grades={GRADES} value={grade} onPick={setGrade} />
        </div>

        <div>
          <Field label="Photo URL" optional type="url" value={imageUrl} onChange={setImageUrl} placeholder="https://…" />
          {imageUrl && (
            <img src={imageUrl} alt="Preview" onError={e => (e.target.style.display = 'none')} className="mt-3 h-40 w-full rounded-2xl object-cover" />
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Beta video<span className="font-normal text-faint"> · optional</span>
          </span>
          {video ? (
            <div className="space-y-3">
              <video src={videoPreview} controls className="aspect-video w-full rounded-2xl bg-black" />
              <div className="flex items-center justify-between text-sm text-muted">
                <span className="truncate">{video.name} · {(video.size / 1024 / 1024).toFixed(1)} MB</span>
                {!loading && (
                  <button type="button" onClick={() => setVideo(null)} className="cursor-pointer text-accent hover:underline">Remove</button>
                )}
              </div>
              {uploadProgress !== null && (
                <div className="h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent transition-[width]" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
          ) : (
            // The hidden native input sits inside a label, so clicking
            // anywhere on the dashed box opens the file picker.
            <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line text-sm text-muted transition hover:bg-surface">
              <span className="font-medium text-ink">Choose a video</span>
              <span>MP4, WebM or MOV · up to {MAX_VIDEO_MB} MB</span>
              <input type="file" accept={VIDEO_TYPES.join(',')} onChange={handleVideoPick} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <Btn full variant="ghost" onClick={() => navigate(`/gym/${gymId}`)}>{createdClimbId ? 'Skip' : 'Cancel'}</Btn>
          <Btn full type="submit" disabled={loading}>{submitLabel()}</Btn>
        </div>
      </form>
    </PageShell>
  );
}

export default AddClimb;
