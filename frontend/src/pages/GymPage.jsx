import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ClimbCard from '../components/ClimbDashboardComponents/ClimbCard';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { Btn, Chip, Eyebrow, Card, ErrorScreen } from '../components/ui/primitives';
import { isSetter } from '../auth';

function GymPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [gym, setGym] = useState(null);
  const [walls, setWalls] = useState([]);
  const [selectedWall, setSelectedWall] = useState(null);
  const [climbs, setClimbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [climbsLoading, setClimbsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const canEdit = isSetter();

  useEffect(() => {
    const fetchGymData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, wallRes] = await Promise.all([
          api.get(`/api/gyms/${id}/`),
          api.get(`/api/gyms/${id}/walls/`),
        ]);
        setGym(gymRes.data);
        setWalls(wallRes.data);
        setSelectedWall(wallRes.data[0]);
      } catch { setError('Failed to load gym. Please try again.'); }
      finally { setLoading(false); }
    };
    fetchGymData();
  }, [id]);

  useEffect(() => {
    if (!selectedWall) return;
    const fetchClimbs = async () => {
      setClimbsLoading(true);
      try {
        const res = await api.get(`/api/gyms/${id}/walls/${selectedWall.id}/climbs/`);
        setClimbs(res.data);
      } catch { setError('Failed to load climbs. Please try again.'); }
      finally { setClimbsLoading(false); }
    };
    fetchClimbs();
  }, [selectedWall]);

  const handleArchiveWall = async () => {
    setArchiving(true);
    try {
      await api.post(`/api/gyms/${id}/walls/${selectedWall.id}/archive-climbs/`);
      setClimbs([]);
      setArchiveConfirm(false);
    } catch { setError('Failed to archive climbs. Please try again.'); }
    finally { setArchiving(false); }
  };

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const headerRight = (
    <div className="mt-[14px] flex items-center gap-2 flex-wrap">
      <Chip tone={gym.is_active ? 'open' : 'closed'} style={{ background: 'rgba(255,255,255,.5)' }}>
        {gym.is_active ? 'Open' : 'Closed'}
      </Chip>
      <div className="flex-1" />
      <button
        onClick={() => navigate(`/gym/${id}/competitions`)}
        className="font-body font-semibold text-xs px-[13px] py-[6px] rounded-full cursor-pointer text-sky-text bg-white/45"
        style={{ border: 'var(--pill-border)' }}
      >
        Competitions
      </button>
      <button
        onClick={() => navigate(`/gym/${id}/leaderboard`)}
        className="font-body font-semibold text-xs px-[13px] py-[6px] rounded-full cursor-pointer text-sky-text bg-white/45"
        style={{ border: 'var(--pill-border)' }}
      >
        Leaderboard
      </button>
    </div>
  );

  return (
    <PageShell back backLabel="Your gyms" backPath="/" eyebrow={gym.location} title={gym.name} right={headerRight} heroHeight={176}>

      <Eyebrow style={{ marginBottom: 10 }}>Select wall</Eyebrow>
      {walls.length === 0 ? (
        <p className="font-serif italic text-sm text-ink3 mb-6">No walls set up yet.</p>
      ) : (
        <div className="flex gap-2 flex-wrap mb-5">
          {walls.map(w => {
            const sel = selectedWall?.id === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => { setSelectedWall(w); setArchiveConfirm(false); }}
                className={`font-body font-semibold text-[13px] px-[15px] py-[7px] rounded-full cursor-pointer border transition-all duration-[120ms] ${
                  sel ? 'border-primary bg-primary text-white' : 'border-line bg-card text-ink'
                }`}
              >
                {w.name}
              </button>
            );
          })}
        </div>
      )}

      {selectedWall && (
        <div className="flex items-center justify-between mb-[14px] gap-[10px]">
          <div className="flex items-baseline gap-[10px] min-w-0">
            <Eyebrow>{selectedWall.name} · {climbsLoading ? '…' : `${climbs.length} climbs`}</Eyebrow>
            <button
              onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/archived`)}
              className="bg-transparent border-0 cursor-pointer font-serif italic text-[13px] text-ink3 p-0"
            >
              View archived
            </button>
          </div>
          {canEdit && <Btn size="sm" onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/add-climb`)}>+ Add climb</Btn>}
        </div>
      )}

      {canEdit && selectedWall && (
        <div className="mb-[18px]">
          {archiveConfirm ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderColor: 'var(--primary)' }}>
              <p className="flex-1 font-serif italic text-[13px] text-ink m-0">
                Archive all {climbs.length} climbs on {selectedWall.name}? This can't be undone.
              </p>
              <Btn size="sm" variant="danger" onClick={handleArchiveWall} disabled={archiving}>
                {archiving ? 'Archiving…' : 'Yes, archive'}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setArchiveConfirm(false)}>Cancel</Btn>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setArchiveConfirm(true)}
              disabled={climbs.length === 0}
              className="bg-transparent border-0 font-serif italic text-[13px] text-ink3 p-0"
              style={{ cursor: climbs.length === 0 ? 'default' : 'pointer', opacity: climbs.length === 0 ? .3 : 1 }}
            >
              Archive all climbs on this wall
            </button>
          )}
        </div>
      )}

      {climbsLoading ? (
        <p className="font-serif italic text-sm text-ink3">Loading climbs…</p>
      ) : (
        <div className="grid grid-cols-2 gap-[13px]">
          {climbs.map(climb => (
            <ClimbCard key={climb.id} climb={climb} gymId={id} wallId={selectedWall?.id} />
          ))}
        </div>
      )}

      {!climbsLoading && climbs.length === 0 && selectedWall && (
        <p className="font-serif italic text-sm text-ink3 text-center py-10">
          {canEdit ? 'No climbs on this wall yet — add one above.' : 'No climbs on this wall yet.'}
        </p>
      )}
    </PageShell>
  );
}

export default GymPage;
