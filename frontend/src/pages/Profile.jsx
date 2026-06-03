import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { getRank, calculatePoints, RankBadge } from '../utils/rankUtils';
import { Card, Chip, SectionLabel, Divider, Stars, Btn, Field, Modal, ErrorScreen } from '../components/ui/primitives';
import { HOLD } from '../theme';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem('access');
  const currentUserId = jwtDecode(token).user_id;
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
  const [followingCount, setFollowingCount] = useState(0);
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
        setFollowingCount(profileRes.data.following_count ?? 0);
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
      if (isFollowing) {
        await api.delete(`/api/users/${profileId}/follow/`);
        setIsFollowing(false);
        setFollowerCount(c => c - 1);
      } else {
        await api.post(`/api/users/${profileId}/follow/`);
        setIsFollowing(true);
        setFollowerCount(c => c + 1);
      }
    } catch {}
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

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    if (newPassword.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    setPasswordSaving(true);
    try {
      await api.post('/api/users/change-password/', { current_password: currentPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.current_password?.[0];
      setPasswordError(detail || "Couldn't change password. Please try again.");
    } finally { setPasswordSaving(false); }
  };

  const totalPoints = calculatePoints(sends);
  const userRank = getRank(totalPoints);

  const avgGrade = sends.length
    ? Math.round(sends.reduce((sum, s) => sum + s.climb_grade, 0) / sends.length)
    : null;

  const homeGym = sends.length
    ? Object.entries(sends.reduce((acc, s) => { acc[s.gym_name] = (acc[s.gym_name] || 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0]
    : null;

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const headerRight = (
    <div className="flex items-center gap-[10px] mt-[14px] flex-wrap">
      <RankBadge rank={userRank} />
      <span className="font-body font-bold text-[13px] text-sky-text">{totalPoints.toLocaleString()} pts</span>
      <span className="font-serif italic text-[13px] text-sky-text opacity-85">
        · since {new Date(profile.date_joined).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
      </span>
    </div>
  );

  return (
    <PageShell back backLabel="Back" eyebrow={isOwnProfile ? 'Your profile' : 'Profile'} title={`@${profile.username}`} right={headerRight} heroHeight={176}>

      {/* Follow row */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex gap-4 flex-1">
          {[{ v: followerCount, l: 'Followers' }, { v: followingCount, l: 'Following' }].map(s => (
            <div key={s.l}>
              <span className="font-display font-normal text-xl text-ink">{s.v}</span>
              <span className="font-body font-semibold text-[11px] tracking-[0.06em] uppercase text-ink2 ml-[5px]">{s.l}</span>
            </div>
          ))}
        </div>
        {!isOwnProfile && (
          <Btn size="sm" variant={isFollowing ? 'ghost' : 'solid'} onClick={handleFollow} disabled={followLoading}>
            {isFollowing ? 'Following' : 'Follow'}
          </Btn>
        )}
      </div>

      {/* Bio */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel style={{ margin: 0 }}>Bio</SectionLabel>
          {isOwnProfile && (
            <button
              onClick={() => { setBioInput(profile.bio || ''); setBioError(null); setShowBioModal(true); }}
              className="bg-transparent border-0 cursor-pointer font-body font-semibold text-xs text-ink2 p-0"
            >
              {profile.bio ? 'Edit' : '+ Add bio'}
            </button>
          )}
        </div>
        {profile.bio ? (
          <p className="font-serif italic text-[15.5px] leading-[1.5] text-ink m-0">{profile.bio}</p>
        ) : (
          <p className="font-serif italic text-sm text-ink3 m-0">
            {isOwnProfile ? 'No bio yet. Add one to tell other climbers about yourself.' : 'No bio yet.'}
          </p>
        )}
      </div>

      <Divider />

      {/* Home gym */}
      {homeGym && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', marginBottom: 20 }}>
          <span className="w-[11px] h-[11px] rounded-full bg-accent shrink-0" />
          <div>
            <p className="font-body font-bold text-[9.5px] tracking-[0.06em] uppercase text-ink2 m-0 mb-[2px]">Home gym</p>
            <p className="font-display font-normal text-[17px] m-0 text-ink">{homeGym}</p>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-[10px] mb-6">
        {[
          { v: sends.length, l: 'Sends' },
          { v: reviews.length, l: 'Reviews' },
          { v: videos.length, l: 'Videos' },
          { v: avgGrade !== null ? `V${avgGrade}` : '—', l: 'Avg' },
        ].map(s => (
          <div key={s.l} className="bg-card border border-line rounded-[13px] px-[6px] py-3 text-center">
            <p className="font-display font-normal text-[22px] m-0 text-ink leading-none">{s.v}</p>
            <p className="font-body font-semibold text-[9.5px] tracking-[0.06em] uppercase text-ink2 mt-[5px] mb-0">{s.l}</p>
          </div>
        ))}
      </div>

      <Divider />

      {/* Sends */}
      <SectionLabel>Sends · {sends.length}</SectionLabel>
      <div className="flex flex-col gap-[10px] mb-6">
        {sends.map(send => (
          <Card key={send.id} hover onClick={() => navigate(`/gym/${send.gym_id}/wall/${send.wall_id}/climb/${send.climb_id}`)} style={{ display: 'flex', overflow: 'hidden', alignItems: 'stretch' }}>
            <div className="w-[7px] shrink-0" style={{ background: HOLD[send.climb_colour] || '#cd6f3f' }} />
            <div className="flex-1 px-[14px] py-[11px] min-w-0">
              <p className="font-display font-normal text-base m-0 text-ink leading-[1.1]">{send.climb_name}</p>
              <p className="font-body text-[11.5px] text-ink2 mt-[3px] mb-0">{send.wall_name} · {send.gym_name}</p>
            </div>
            <div className="flex flex-col items-end justify-center gap-1 px-[14px]">
              <Chip tone="accent">V{send.climb_grade}</Chip>
              <span className="font-body text-[11px] text-ink2">{send.attempts} att.</span>
            </div>
          </Card>
        ))}
        {sends.length === 0 && <p className="font-serif italic text-sm text-ink3">No sends logged yet.</p>}
      </div>

      <Divider />

      {/* Reviews */}
      <SectionLabel>Reviews · {reviews.length}</SectionLabel>
      <div className="flex flex-col gap-3 mb-6">
        {reviews.map(rv => (
          <Card key={rv.id} style={{ padding: '13px 15px' }} hover onClick={() => navigate(`/gym/${rv.gym_id}/wall/${rv.wall_id}/climb/${rv.climb_id}`)}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-display font-normal text-base m-0 text-ink">{rv.climb_name}</p>
              <Stars n={rv.stars} />
            </div>
            <p className="font-serif italic text-[14.5px] leading-[1.4] text-ink m-0 mb-[6px]">"{rv.comment}"</p>
            <p className="font-body text-[11.5px] text-ink2 m-0">{rv.wall_name} · {rv.gym_name}</p>
          </Card>
        ))}
        {reviews.length === 0 && <p className="font-serif italic text-sm text-ink3">No reviews yet.</p>}
      </div>

      <Divider />

      {/* Videos */}
      <SectionLabel>Videos · {videos.length}</SectionLabel>
      <div className="flex gap-[11px] flex-wrap" style={{ marginBottom: isOwnProfile ? 32 : 0 }}>
        {videos.map(video => (
          <video key={video.id} width="180" height="120" controls className="rounded-[12px] border border-line">
            <source src={video.video_url} type="video/mp4" />
          </video>
        ))}
        {videos.length === 0 && <p className="font-serif italic text-sm text-ink3">No videos yet.</p>}
      </div>

      {/* Account settings */}
      {isOwnProfile && (
        <>
          <Divider m={32} />
          <SectionLabel>Account</SectionLabel>
          <Card style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="font-body font-bold text-[13px] text-ink m-0">Password</p>
              <p className="font-serif italic text-[13px] text-ink3 mt-[2px] mb-0">Change your login password</p>
            </div>
            <Btn size="sm" variant="ghost" onClick={() => { setPasswordError(null); setPasswordSuccess(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true); }}>
              Change
            </Btn>
          </Card>
        </>
      )}

      {showBioModal && (
        <Modal title="Edit bio" subtitle="Tell other climbers about yourself" onClose={() => setShowBioModal(false)}>
          {bioError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{bioError}</p>}
          <Field label="Bio" value={bioInput} onChange={setBioInput} placeholder="I've been climbing for 3 years…" textarea />
          <div className="flex gap-[10px]">
            <Btn full onClick={handleSaveBio} disabled={bioSaving}>{bioSaving ? 'Saving…' : 'Save'}</Btn>
            <Btn full variant="ghost" onClick={() => setShowBioModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal title="Change password" onClose={() => setShowPasswordModal(false)}>
          {passwordError && <p className="font-serif italic text-danger text-[13px] mb-[10px]">{passwordError}</p>}
          {passwordSuccess ? (
            <div className="text-center py-3">
              <p className="font-serif italic text-[15px] text-good mb-4">Password changed successfully.</p>
              <Btn full onClick={() => setShowPasswordModal(false)}>Done</Btn>
            </div>
          ) : (
            <div className="flex flex-col gap-[14px]">
              <Field label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Your current password" />
              <Field label="New password" value={newPassword} onChange={setNewPassword} type="password" placeholder="At least 8 characters" />
              <Field label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repeat new password" />
              <div className="flex gap-[10px]">
                <Btn full onClick={handleChangePassword} disabled={passwordSaving}>{passwordSaving ? 'Saving…' : 'Change password'}</Btn>
                <Btn full variant="ghost" onClick={() => setShowPasswordModal(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}

export default Profile;
