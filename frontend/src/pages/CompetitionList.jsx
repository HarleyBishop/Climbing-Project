import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { PageShell } from '../components/ui/PageShell';
import { PageSkeleton } from '../components/Skeleton';
import { isSetter } from '../auth';
import { Card, Chip, SectionLabel, Btn, Empty, ErrorScreen } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function CompCard({ comp, gymId }) {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate(`/gym/${gymId}/competitions/${comp.id}`)} className="p-6">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <Chip tone={comp.comp_type}>{capitalise(comp.comp_type)}</Chip>
        <Chip tone={comp.status}>{comp.status === 'open' ? 'Live now' : capitalise(comp.status)}</Chip>
      </div>
      <h3 className="text-xl font-semibold">{comp.title}</h3>
      {comp.description && <p className="mt-1 line-clamp-2 text-muted">{comp.description}</p>}
      <p className="mt-4 text-sm text-faint">
        {fmtDate(comp.start_date)} – {fmtDate(comp.end_date)} · {comp.registration_count} registered
      </p>
    </Card>
  );
}

function CompetitionList() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const canCreate = isSetter();

  const [gym, setGym] = useState(null);
  const [comps, setComps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [gymRes, compsRes] = await Promise.all([
          api.get(`/api/gyms/${gymId}/`),
          api.get(`/api/gyms/${gymId}/competitions/`),
        ]);
        setGym(gymRes.data);
        setComps(compsRes.data);
      } catch { setError('Failed to load competitions.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [gymId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorScreen message={error} onRetry={() => window.location.reload()} />;

  const groups = [
    ['Live now', comps.filter(c => c.status === 'open')],
    ['Upcoming', comps.filter(c => c.status === 'upcoming')],
    ['Past', comps.filter(c => c.status === 'closed')],
  ].filter(([, list]) => list.length > 0);

  const createButton = canCreate && (
    <Btn className="mt-6" onClick={() => navigate(`/gym/${gymId}/competitions/create`)}>Create competition</Btn>
  );

  return (
    <PageShell back backLabel={gym.name} backPath={`/gym/${gymId}`} eyebrow={gym.name} title="Competitions" right={createButton}>
      {comps.length === 0 && <Empty>No competitions yet.</Empty>}
      {groups.map(([label, list]) => (
        <BlurFade key={label} inView className="mb-12">
          <SectionLabel>{label}</SectionLabel>
          <div className="space-y-3">
            {list.map(c => <CompCard key={c.id} comp={c} gymId={gymId} />)}
          </div>
        </BlurFade>
      ))}
    </PageShell>
  );
}

export default CompetitionList;
