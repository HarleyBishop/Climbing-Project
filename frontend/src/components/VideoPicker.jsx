import { useEffect, useMemo } from 'react';
import { videoFileError, MAX_VIDEO_MB, VIDEO_TYPES } from '../lib/videoUpload';

/**
 * File picker + preview + progress bar for a single climb video. Only picks
 * the file; the parent form does the upload (see uploadClimbVideo) so it can
 * order it after its own save.
 *   onChange(file | null)  — a valid file was picked, or the video was removed
 *   onError(message)       — the picked file failed type/size checks
 *   progress               — 0–100 while uploading, null otherwise
 *   locked                 — hides "Remove" while a submit is in flight
 */
export function VideoPicker({ file, onChange, onError, progress = null, locked }) {
  // Object URLs keep the file in memory until revoked, so release the old
  // preview whenever the file changes or the picker unmounts.
  const preview = useMemo(() => file && URL.createObjectURL(file), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const handlePick = (e) => {
    const picked = e.target.files[0];
    e.target.value = ''; // lets the same file be re-picked after removing it
    if (!picked) return;
    const problem = videoFileError(picked);
    onError?.(problem);
    if (!problem) onChange(picked);
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">
        Beta video<span className="font-normal text-faint"> · optional</span>
      </span>
      {file ? (
        <div className="space-y-3">
          <video src={preview} controls className="aspect-video w-full rounded-2xl bg-black" />
          <div className="flex items-center justify-between gap-3 text-sm text-muted">
            <span className="truncate">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span>
            {!locked && (
              <button type="button" onClick={() => onChange(null)} className="cursor-pointer text-accent hover:underline">Remove</button>
            )}
          </div>
          {progress !== null && (
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        // The hidden native input sits inside a label, so clicking anywhere
        // on the dashed box opens the file picker.
        <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line text-sm text-muted transition hover:bg-surface">
          <span className="font-medium text-ink">Choose a video</span>
          <span>MP4, WebM or MOV · up to {MAX_VIDEO_MB} MB</span>
          <input type="file" accept={VIDEO_TYPES.join(',')} onChange={handlePick} className="hidden" />
        </label>
      )}
    </div>
  );
}
