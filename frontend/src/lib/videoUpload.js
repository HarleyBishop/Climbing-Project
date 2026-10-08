import axios from 'axios';
import api from '../api';

// Must match MAX_VIDEO_BYTES / VIDEO_EXTENSIONS in backend/climbingAPI/storage.py.
export const MAX_VIDEO_MB = 50;
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// Returns an error message, or null if the file is OK to upload. Checking here
// saves the user a round trip; the backend and the bucket check again.
export function videoFileError(file) {
  if (!VIDEO_TYPES.includes(file.type)) return 'Video must be MP4, WebM or MOV.';
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return `Video must be under ${MAX_VIDEO_MB} MB.`;
  return null;
}

/**
 * Uploads a video file and attaches it to a climb, in three steps:
 *   1. ask our API for a signed Supabase upload URL
 *   2. PUT the file straight to Supabase (bare axios, not `api`, because
 *      our baseURL and JWT header don't belong on a Supabase request)
 *   3. save the public URL as a Video row
 * If step 2 fails, nothing is written to our DB.
 */
export async function uploadClimbVideo(climbPath, file, title, onProgress) {
  const { data } = await api.post(`${climbPath}/videos/upload-url/`, {
    content_type: file.type,
    size: file.size,
  });
  await axios.put(data.upload_url, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: e => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
  });
  await api.post(`${climbPath}/videos/`, { video_url: data.video_url, title: title.trim() });
}
