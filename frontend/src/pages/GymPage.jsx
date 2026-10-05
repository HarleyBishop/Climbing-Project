import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ClimbCard from '../components/ClimbDashboardComponents/ClimbCard';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { Btn, Chip, Card, Empty, ErrorScreen } from '../components/ui/primitives';
import { cn } from '../lib/utils';
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
  }, [id, selectedWall]);

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

  const header = (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Chip tone={gym.is_active ? 'open' : 'closed'}>{gym.is_active ? 'Open now' : 'Closed'}</Chip>
      <div className="ml-auto flex gap-2">
        <Btn size="sm" variant="ghost" onClick={() => navigate(`/gym/${id}/competitions`)}>Competitions</Btn>
        <Btn size="sm" variant="ghost" onClick={() => navigate(`/gym/${id}/leaderboard`)}>Leaderboard</Btn>
      </div>
    </div>
  );

  return (
    <PageShell back backLabel="Your gyms" backPath="/" eyebrow={gym.location} title={gym.name} right={header}>
      {walls.length === 0 ? (
        <Empty>No walls set up yet.</Empty>
      ) : (
        // Horizontally scrolling wall picker; scrollbar hidden.
        <div className="-mx-5 mb-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {walls.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => { setSelectedWall(w); setArchiveConfirm(false); }}
              className={cn(
                'shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition',
                selectedWall?.id === w.id ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:bg-surface'
              )}
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      {selectedWall && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{selectedWall.name}</h2>
            <p className="text-sm text-muted">
              {climbsLoading ? 'Loading…' : `${climbs.length} active climbs`}
              {' · '}
              <button onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/archived`)} className="cursor-pointer text-accent hover:underline">
                View archived
              </button>
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Btn size="sm" variant="ghost" onClick={() => setArchiveConfirm(true)} disabled={climbs.length === 0}>Archive all</Btn>
              <Btn size="sm" onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/add-climb`)}>Add climb</Btn>
            </div>
          )}
        </div>
      )}

      {archiveConfirm && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 p-4 ring-1 ring-danger/30">
          <p className="flex-1 text-sm">Archive all {climbs.length} climbs on {selectedWall.name}? This can't be undone.</p>
          <Btn size="sm" variant="ghost" onClick={() => setArchiveConfirm(false)}>Cancel</Btn>
          <Btn size="sm" variant="danger" onClick={handleArchiveWall} disabled={archiving}>{archiving ? 'Archiving…' : 'Archive'}</Btn>
        </Card>
      )}

      {!climbsLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {climbs.map(climb => (
            <ClimbCard key={climb.id} climb={climb} gymId={id} wallId={selectedWall?.id} />
          ))}
        </div>
      )}

      {!climbsLoading && climbs.length === 0 && selectedWall && (
        <Empty>{canEdit ? 'No climbs on this wall yet. Add the first one.' : 'No climbs on this wall yet.'}</Empty>
      )}
    </PageShell>
  );
}

export default GymPage;
