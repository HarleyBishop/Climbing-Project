import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getDecodedToken } from '../auth';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, calculatePoints, RankBadge } from '../utils/rankUtils';
import { Card, Chip, SectionLabel, Stars, Btn, Field, Modal, Avatar, Empty, ErrorText, ErrorScreen } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';
import { NumberTicker } from '../components/magicui/number-ticker';
import { holdColour } from '../lib/holds';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const currentUserId = getDecodedToken()?.user_id;
  const profileId = userId || currentUserId;
  const isOwnProfile = parseInt(profileId) === currentUserId;

  const [profile, setProfile] = useState(null);
  const [sends, setSends] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [showBioModal, setShowBioModal] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [bioError, setBioError] = useState(null);
  const [bioSaving, setBioSaving] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

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
        setIsFollowing(profileRes.data.is_following ?? false);
        setFollowerCount(profileRes.data.follower_count ?? 0);
        setSends(sendsRes.data);
        setReviews(reviewsRes.data);
        setVideos(videosRes.data);
      } catch { setError('Failed to load profile. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [profileId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) await api.delete(`/api/users/${profileId}/follow/`);
      else await api.post(`/api/users/${profileId}/follow/`);
      setFollowerCount(c => c + (isFollowing ? -1 : 1));
      setIsFollowing(!isFollowing);
    } catch { /* button just stays as-is */ }
    finally { setFollowLoading(false); }
  };

  const handleSaveBio = async () => {
    setBioError(null);
    setBioSaving(true);
    try {
      const res = await api.patch(`/api/users/${profileId}/`, { bio: bioInput });
      setProfile(prev => ({ ...prev, bio: res.data.bio }));
      setShowBioModal(false);
    } catch { setBioError("Couldn't save your bio. Please try again."); }
    finally { setBioSaving(false); }
  };

  const openPasswordModal = () => {
    setPasswordError(null); setPasswordSuccess(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    setPasswordSaving(true);
    try {
      await api.post('/api/users/change-password/', { current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
    } catch (err) {
      const data = err.response?.data;
      setPasswordError(data?.current_password?.[0] || data?.new_password?.[0] || data?.detail || "Couldn't change password. Please try again.");
    } finally { setPasswordSaving(false); }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const totalPoints = calculatePoints(sends);
  const userRank = getRank(totalPoints);
  const avgGrade = sends.length ? Math.round(sends.reduce((sum, s) => sum + s.climb_grade, 0) / sends.length) : null;
  // Most-sent-at gym.
  const homeGym = sends.length
    ? Object.entries(sends.reduce((acc, s) => ({ ...acc, [s.gym_name]: (acc[s.gym_name] || 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const since = new Date(profile.date_joined).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  const goToClimb = (item) => navigate(`/gym/${item.gym_id}/wall/${item.wall_id}/climb/${item.climb_id}`);

  return (
    <PageShell back>
      {/* Centred identity header. */}
      <div className="flex flex-col items-center text-center">
        <Avatar name={profile.username} size={96} className="shadow-lg" />
        <h1 className="mt-5 text-4xl font-semibold">@{profile.username}</h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <RankBadge rank={userRank} />
          <Chip>{totalPoints.toLocaleString()} pts</Chip>
          {homeGym && <Chip>Home · {homeGym}</Chip>}
        </div>
        <p className="mt-4 max-w-md text-muted">
          {profile.bio || (isOwnProfile ? 'No bio yet. Tell other climbers about yourself.' : 'No bio yet.')}
        </p>
        <p className="mt-2 text-sm text-faint">
          <strong className="font-semibold text-ink">{followerCount}</strong> followers ·{' '}
          <strong className="font-semibold text-ink">{profile.following_count ?? 0}</strong> following · climbing since {since}
        </p>
        <div className="mt-6 flex gap-2">
          {isOwnProfile ? (
            <Btn size="sm" variant="ghost" onClick={() => { setBioInput(profile.bio || ''); setBioError(null); setShowBioModal(true); }}>
              {profile.bio ? 'Edit bio' : 'Add bio'}
            </Btn>
          ) : (
            <Btn size="sm" variant={isFollowing ? 'ghost' : 'solid'} onClick={handleFollow} disabled={followLoading}>
              {isFollowing ? 'Following' : 'Follow'}
            </Btn>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-4 gap-3">
        {[
          { v: sends.length, l: 'Sends' },
          { v: reviews.length, l: 'Reviews' },
          { v: videos.length, l: 'Videos' },
          { v: avgGrade, l: 'Avg grade', prefix: 'V' },
        ].map(s => (
          <div key={s.l} className="rounded-2xl bg-white py-5 text-center ring-1 ring-line/60">
            <p className="text-2xl font-semibold sm:text-3xl">
              {s.v == null ? '—' : <>{s.prefix}<NumberTicker value={s.v} /></>}
            </p>
            <p className="mt-1 text-xs text-muted">{s.l}</p>
          </div>
        ))}
      </div>

      <BlurFade inView className="mt-16">
        <SectionLabel right={sends.length}>Sends</SectionLabel>
        <div className="space-y-3">
          {sends.map(send => (
            <Card key={send.id} onClick={() => goToClimb(send)} className="flex items-stretch overflow-hidden">
              <span className="w-1.5 shrink-0" style={{ background: holdColour(send.climb_colour) }} />
              <div className="min-w-0 flex-1 px-5 py-4">
                <p className="truncate font-semibold">{send.climb_name}</p>
                <p className="text-sm text-muted">{send.wall_name} · {send.gym_name}</p>
              </div>
              <div className="flex flex-col items-end justify-center gap-1 px-5">
                <Chip tone="accent">V{send.climb_grade}</Chip>
                <span className="text-xs text-muted">{send.attempts} att.</span>
              </div>
            </Card>
          ))}
          {sends.length === 0 && <Empty>No sends logged yet.</Empty>}
        </div>
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel right={reviews.length}>Reviews</SectionLabel>
        <div className="space-y-3">
          {reviews.map(rv => (
            <Card key={rv.id} onClick={() => goToClimb(rv)} className="p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold">{rv.climb_name}</p>
                <Stars n={rv.stars} />
              </div>
              {rv.comment && <p className="leading-snug">“{rv.comment}”</p>}
              <p className="mt-2 text-sm text-muted">{rv.wall_name} · {rv.gym_name}</p>
            </Card>
          ))}
          {reviews.length === 0 && <Empty>No reviews yet.</Empty>}
        </div>
      </BlurFade>

      <BlurFade inView className="mt-16">
        <SectionLabel right={videos.length}>Videos</SectionLabel>
        {videos.length === 0 ? <Empty>No videos yet.</Empty> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {videos.map(video => (
              <Card key={video.id} className="overflow-hidden">
                <video src={video.video_url} controls preload="metadata" className="aspect-video w-full bg-black" />
                <button onClick={() => goToClimb(video)} className="block w-full cursor-pointer p-4 text-left">
                  <p className="font-semibold">{video.title || 'Beta video'}</p>
                  <p className="text-sm text-muted">{video.climb_name} · {video.wall_name} · {video.gym_name}</p>
                </button>
              </Card>
            ))}
          </div>
        )}
      </BlurFade>

      {isOwnProfile && (
        <BlurFade inView className="mt-16">
          <SectionLabel>Account</SectionLabel>
          <Card className="flex items-center justify-between p-5">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted">Change your login password</p>
            </div>
            <Btn size="sm" variant="ghost" onClick={openPasswordModal}>Change</Btn>
          </Card>
        </BlurFade>
      )}

      {showBioModal && (
        <Modal title="Edit bio" subtitle="Tell other climbers about yourself" onClose={() => setShowBioModal(false)}>
          {bioError && <ErrorText>{bioError}</ErrorText>}
          <Field label="Bio" value={bioInput} onChange={setBioInput} placeholder="I've been climbing for 3 years…" textarea />
          <div className="flex gap-3">
            <Btn full variant="ghost" onClick={() => setShowBioModal(false)}>Cancel</Btn>
            <Btn full onClick={handleSaveBio} disabled={bioSaving}>{bioSaving ? 'Saving…' : 'Save'}</Btn>
          </div>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal title="Change password" onClose={() => setShowPasswordModal(false)}>
          {passwordSuccess ? (
            <>
              <p className="text-good">Password changed successfully.</p>
              <Btn full onClick={() => setShowPasswordModal(false)}>Done</Btn>
            </>
          ) : (
            <>
              {passwordError && <ErrorText>{passwordError}</ErrorText>}
              <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
              <Field label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="At least 8 characters" />
              <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" />
              <div className="flex gap-3">
                <Btn full variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancel</Btn>
                <Btn full onClick={handleChangePassword} disabled={passwordSaving}>{passwordSaving ? 'Saving…' : 'Change'}</Btn>
              </div>
            </>
          )}
        </Modal>
      )}
    </PageShell>
  );
}

export default Profile;
