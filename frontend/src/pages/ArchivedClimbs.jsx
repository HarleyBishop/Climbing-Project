import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ClimbCard from '../components/ClimbDashboardComponents/ClimbCard';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { useTheme } from '../theme';

function ArchivedClimbs() {
  const P = useTheme();
  const { gymId, wallId } = useParams();

  const [climbs, setClimbs] = useState([]);
  const [wallName, setWallName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [archivedRes, wallsRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/walls/${wallId}/climbs/archived/`),
          api.get(`/api/gyms/${gymId}/walls/`),
        ]);
        setClimbs(archivedRes.data);
        const wall = wallsRes.data.find(w => String(w.id) === String(wallId));
        setWallName(wall?.name ?? '');
      } catch { setError('Failed to load archived climbs.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [gymId, wallId]);

  if (loading) return <PageSkeleton />;

  if (error) return (
    <div style={{ minHeight: '100vh', background: P.sheet, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', color: '#bb5b46', fontSize: 14, marginBottom: 16 }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ fontFamily: P.body, fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 12, background: P.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <PageShell
      back backLabel="Back to gym" backPath={`/gym/${gymId}`}
      eyebrow={wallName ? `${wallName} · old routes` : 'Old routes'}
      title="Archived climbs"
    >
      {climbs.length === 0 ? (
        <p style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 14, color: P.ink3, textAlign: 'center', padding: '48px 0' }}>
          No archived climbs on this wall yet.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
          {climbs.map(climb => (
            <ClimbCard key={climb.id} climb={climb} gymId={gymId} wallId={wallId} setLabel />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default ArchivedClimbs;
