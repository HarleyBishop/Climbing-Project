import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ClimbCard from '../components/ClimbDashboardComponents/ClimbCard';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { Btn, Chip, Eyebrow, Card } from '../components/ui/primitives';
import { isSetter } from '../auth';
import { useTheme } from '../theme';

function GymPage() {
  const P = useTheme();
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

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#fbf5e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: '"Newsreader", serif', fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: '"Mulish", sans-serif', fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: '#cf6f49', color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  const headerRight = (
    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <Chip tone={gym.is_active ? 'open' : 'closed'} style={{ background: 'rgba(255,255,255,.5)' }}>
        {gym.is_active ? 'Open' : 'Closed'}
      </Chip>
      <div style={{ flex: 1 }} />
      <button onClick={() => navigate(`/gym/${id}/competitions`)}
        style={{ fontFamily: P.body, fontWeight: 600, fontSize: 12, padding: '6px 13px', borderRadius: 999, cursor: 'pointer', border: '1px solid rgba(58,67,41,.28)', background: 'rgba(255,255,255,.45)', color: P.skyText }}>
        Competitions
      </button>
      <button onClick={() => navigate(`/gym/${id}/leaderboard`)}
        style={{ fontFamily: P.body, fontWeight: 600, fontSize: 12, padding: '6px 13px', borderRadius: 999, cursor: 'pointer', border: '1px solid rgba(58,67,41,.28)', background: 'rgba(255,255,255,.45)', color: P.skyText }}>
        Leaderboard
      </button>
    </div>
  );

  return (
    <PageShell back backLabel="Your gyms" backPath="/" eyebrow={gym.location} title={gym.name} right={headerRight} heroHeight={176}>

      <Eyebrow style={{ marginBottom: 10 }}>Select wall</Eyebrow>
      {walls.length === 0 ? (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, marginBottom: 24 }}>No walls set up yet.</p>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {walls.map(w => {
            const sel = selectedWall?.id === w.id;
            return (
              <button key={w.id} type="button"
                onClick={() => { setSelectedWall(w); setArchiveConfirm(false); }}
                style={{ fontFamily: P.body, fontWeight: 600, fontSize: 13, padding: '7px 15px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${sel ? P.primary : P.line}`, background: sel ? P.primary : P.card, color: sel ? '#fff' : P.ink, transition: 'all .12s' }}>
                {w.name}
              </button>
            );
          })}
        </div>
      )}

      {selectedWall && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <Eyebrow>{selectedWall.name} · {climbsLoading ? '…' : `${climbs.length} climbs`}</Eyebrow>
            <button onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/archived`)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink3, padding: 0 }}>
              View archived
            </button>
          </div>
          {canEdit && <Btn size="sm" onClick={() => navigate(`/gym/${id}/wall/${selectedWall.id}/add-climb`)}>+ Add climb</Btn>}
        </div>
      )}

      {canEdit && selectedWall && (
        <div style={{ marginBottom: 18 }}>
          {archiveConfirm ? (
            <Card style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderColor: P.primary }}>
              <p style={{ flex: 1, fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink, margin: 0 }}>
                Archive all {climbs.length} climbs on {selectedWall.name}? This can't be undone.
              </p>
              <Btn size="sm" variant="danger" onClick={handleArchiveWall} disabled={archiving}>
                {archiving ? 'Archiving…' : 'Yes, archive'}
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setArchiveConfirm(false)}>Cancel</Btn>
            </Card>
          ) : (
            <button type="button" onClick={() => setArchiveConfirm(true)} disabled={climbs.length === 0}
              style={{ background: 'none', border: 'none', cursor: climbs.length === 0 ? 'default' : 'pointer', fontFamily: P.serif, fontStyle: 'italic', fontSize: 13, color: P.ink3, padding: 0, opacity: climbs.length === 0 ? .3 : 1 }}>
              Archive all climbs on this wall
            </button>
          )}
        </div>
      )}

      {climbsLoading ? (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3 }}>Loading climbs…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
          {climbs.map(climb => (
            <ClimbCard key={climb.id} climb={climb} gymId={id} wallId={selectedWall?.id} />
          ))}
        </div>
      )}

      {!climbsLoading && climbs.length === 0 && selectedWall && (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '40px 0' }}>
          {canEdit ? 'No climbs on this wall yet — add one above.' : 'No climbs on this wall yet.'}
        </p>
      )}
    </PageShell>
  );
}

export default GymPage;
