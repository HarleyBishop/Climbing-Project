"""
Supabase Storage helpers for climb videos.

Video files never pass through Django. The backend asks Supabase for a
short-lived signed upload URL, and the browser PUTs the file straight to it.
Proxying uploads through the backend would hold a Render worker for the whole
upload (gunicorn kills sync workers after 30s) and count every byte against
its bandwidth. Postgres only stores the resulting public URL in Video.video_url.

The service-role key bypasses Supabase's row-level security, so it stays
server-side. The frontend only ever sees a one-off signed URL for a single path.
"""
import uuid

import requests
from django.conf import settings

# Supabase's free tier caps a single object at 50 MB. Set the same limit on
# the bucket in the dashboard so the cap holds even if someone ignores the
# check here and uploads a bigger file to the signed URL.
MAX_VIDEO_BYTES = 50 * 1024 * 1024

# Formats every major browser can play in a <video> tag. QuickTime is allowed
# because iPhones record .mov by default.
VIDEO_EXTENSIONS = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
}


class StorageError(Exception):
    pass


def is_configured():
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


def create_video_upload(climb_id, content_type):
    """
    Reserves a unique path for one video and returns (upload_url, public_url).
    The uuid filename means two uploads can't overwrite each other and the
    URL can't be guessed from the climb id.
    """
    ext = VIDEO_EXTENSIONS[content_type]
    path = f'climbs/{climb_id}/{uuid.uuid4().hex}.{ext}'
    base = f'{settings.SUPABASE_URL}/storage/v1'
    bucket = settings.SUPABASE_VIDEO_BUCKET

    try:
        resp = requests.post(
            f'{base}/object/upload/sign/{bucket}/{path}',
            headers={
                'Authorization': f'Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}',
                'apikey': settings.SUPABASE_SERVICE_ROLE_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        # Supabase returns a URL relative to /storage/v1, with the upload token
        # in the query string.
        signed_path = resp.json()['url']
    except (requests.RequestException, ValueError, KeyError) as exc:
        raise StorageError(f'Could not create upload URL: {exc}')

    return f'{base}{signed_path}', f'{base}/object/public/{bucket}/{path}'
