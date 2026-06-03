import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import ClimbCard from '../components/ClimbDashboardComponents/ClimbCard';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { ErrorScreen } from '../components/ui/primitives';

function ArchivedClimbs() {
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
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  return (
    <PageShell
      back backLabel="Back to gym" backPath={`/gym/${gymId}`}
      eyebrow={wallName ? `${wallName} · old routes` : 'Old routes'}
      title="Archived climbs"
    >
      {climbs.length === 0 ? (
        <p className="font-serif italic text-sm text-ink3 text-center py-12">
          No archived climbs on this wall yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-[13px]">
          {climbs.map(climb => (
            <ClimbCard key={climb.id} climb={climb} gymId={gymId} wallId={wallId} setLabel />
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default ArchivedClimbs;
